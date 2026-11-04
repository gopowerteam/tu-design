import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Popover } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');
const positioner = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="positioner"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
});

// 渲染函数用法：h(Popover, props, { default: 触发元素, content: 面板内容 })
function mountPopover(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(Popover, props, {
          default: () => [h("button", { type: "button" }, "点我")],
          content: () => "气泡内容",
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Popover", () => {
  it("默认插槽即触发元素本体，不产生额外包裹元素", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { defaultOpen: true },
            {
              default: () => [h("a", { class: "link", href: "/help" }, "帮助")],
              content: () => "前往帮助",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    // asChild 语义合并：data-part="trigger" 直接落在 <a> 上，且全树仅此一个触发元素
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/help");
    expect(a.attributes("data-part")).toBe("trigger");
    expect(document.body.querySelectorAll('[data-part="trigger"]').length).toBe(1);
    expect(w.find('[data-part="trigger"]').element).toBe(a.element);
    w.unmount();
  });

  it("defaultOpen 初始展开，#content 插槽渲染面板内容", async () => {
    const w = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toContain("气泡内容");
    w.unmount();
  });

  it("点击 trigger 切换并发出 update:open", async () => {
    const onUpdate = vi.fn();
    const w = mountPopover({ "onUpdate:open": onUpdate });
    const btn = w.find("button[data-part='trigger']");

    await btn.trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(onUpdate).toHaveBeenCalledWith(true);

    await btn.trigger("click");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("v-model:open 受控", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              default: () => [h("button", { type: "button" }, "点我")],
              content: () => "气泡内容",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    const btn = () => w.find("button[data-part='trigger']");

    await btn().trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    await btn().trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("align/contentClass/contentProps 透传面板", async () => {
    const w = mountPopover({
      defaultOpen: true,
      align: "end",
      contentClass: "w-56 p-0",
      contentProps: { id: "custom-panel" },
    });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    // align="end" → Ark positioning.placement = bottom-end（data-placement 可观测）
    expect(content()!.dataset.placement).toBe("bottom-end");
    // contentProps 透传到面板根元素
    expect(content()!.id).toBe("custom-panel");
    // contentClass 与内置类合并：twMerge 保证后者覆盖同组冲突类
    expect(content()!.className).toContain("w-56");
    expect(content()!.className).toContain("p-0");
    expect(content()!.className).not.toContain("w-72");
    expect(content()!.className).not.toContain("p-4");
    // 非冲突内置类保留
    expect(content()!.className).toContain("rounded-md");
    w.unmount();
  });

  // —— side × align 合成 12 方位 placement ——
  it("side×align 合成 placement（含居中不带后缀）", async () => {
    const w = mountPopover({ defaultOpen: true, side: "top", align: "end" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.dataset.placement).toBe("top-end");
    w.unmount();

    const w2 = mountPopover({ defaultOpen: true, side: "left" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.dataset.placement).toBe("left");
    w2.unmount();
  });

  // —— 箭头 ——
  it("arrow 渲染箭头，默认不渲染", async () => {
    const arrow = () => document.querySelector<HTMLElement>('[data-part="arrow"]');
    const w = mountPopover({ defaultOpen: true, arrow: true, arrowClass: "test-arrow-cls" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(arrow()).not.toBeNull();
    expect(arrow()!.className).toContain("test-arrow-cls");
    w.unmount();

    const w2 = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(arrow()).toBeNull();
    w2.unmount();
  });

  // —— disabled：click 切 Anchor，内建 TOGGLE 不再存在 ——
  it("disabled 短路 click 触发", async () => {
    const onUpdate = vi.fn();
    const w = mountPopover({ disabled: true, "onUpdate:open": onUpdate });
    const btn = w.find("button");
    // disabled 时切 Anchor 路径，aria 手动接线兜底
    expect(btn.attributes("aria-haspopup")).toBe("dialog");
    await btn.trigger("click");
    await new Promise((r) => setTimeout(r, 20));
    expect(content()?.dataset.state).not.toBe("open");
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  // —— hover 触发：延迟开关 + 面板保活 ——
  it("trigger=hover 按延迟开关，悬浮面板保活可关", async () => {
    vi.useFakeTimers();
    try {
      const onUpdate = vi.fn();
      const w = mountPopover({ trigger: "hover", "onUpdate:open": onUpdate });
      const btn = w.find("button");

      // hover 打开经 openDelay
      await btn.trigger("mouseenter");
      expect(onUpdate).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100);
      expect(onUpdate).toHaveBeenCalledWith(true);
      await vi.advanceTimersByTimeAsync(10);
      expect(content()?.dataset.state).toBe("open");

      // 离开触发器 → closeDelay 内进入面板 → 保活不关闭
      await btn.trigger("mouseleave");
      content()!.dispatchEvent(new MouseEvent("mouseenter"));
      await vi.advanceTimersByTimeAsync(100);
      expect(content()?.dataset.state).toBe("open");

      // 离开面板 → 挂起关闭计时 → 关闭
      content()!.dispatchEvent(new MouseEvent("mouseleave"));
      await vi.advanceTimersByTimeAsync(100);
      expect(onUpdate).toHaveBeenLastCalledWith(false);
      w.unmount();
      await vi.advanceTimersByTimeAsync(10);
    } finally {
      vi.useRealTimers();
    }
  });

  it("trigger=hover 且 keepAliveOnHover=false 时悬浮面板即关", async () => {
    vi.useFakeTimers();
    try {
      const onUpdate = vi.fn();
      const w = mountPopover({
        trigger: "hover",
        keepAliveOnHover: false,
        "onUpdate:open": onUpdate,
      });
      const btn = w.find("button");
      await btn.trigger("mouseenter");
      await vi.advanceTimersByTimeAsync(100);
      await btn.trigger("mouseleave");
      // 面板已开且悬浮，但保活被关：closeDelay 到点即关
      await vi.advanceTimersByTimeAsync(100);
      expect(onUpdate).toHaveBeenLastCalledWith(false);
      w.unmount();
      await vi.advanceTimersByTimeAsync(10);
    } finally {
      vi.useRealTimers();
    }
  });

  // —— focus 触发：trigger 聚焦开；焦点移入面板保持；焦点离开面板关闭 ——
  // 注：面板打开后 zag autoFocus 会把真实焦点移入面板并触发触发器 focusout（由面板
  // 聚焦保活兜住），故关闭断言走面板 focusout（panel-leave）路径，语义等价且确定
  it("trigger=focus 聚焦开、焦点进面板保活、离板关", async () => {
    vi.useFakeTimers();
    try {
      const onUpdate = vi.fn();
      const w = mountPopover({ trigger: "focus", "onUpdate:open": onUpdate });
      const btn = w.find("button");
      await btn.trigger("focusin");
      await vi.advanceTimersByTimeAsync(100);
      expect(onUpdate).toHaveBeenCalledWith(true);
      await vi.advanceTimersByTimeAsync(10);
      expect(content()?.dataset.state).toBe("open");

      // 焦点移入面板：保持打开
      content()!.dispatchEvent(new Event("focusin", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(100);
      expect(content()?.dataset.state).toBe("open");

      // 焦点离开面板：closeDelay 后关闭
      content()!.dispatchEvent(new Event("focusout", { bubbles: true }));
      await vi.advanceTimersByTimeAsync(100);
      expect(onUpdate).toHaveBeenLastCalledWith(false);
      w.unmount();
      await vi.advanceTimersByTimeAsync(10);
    } finally {
      vi.useRealTimers();
    }
  });

  // —— manual 纯受控：点击触发元素不得切换 ——
  it("trigger=manual 纯受控，点击不切换", async () => {
    const onUpdate = vi.fn();
    const w = mountPopover({ trigger: "manual", "onUpdate:open": onUpdate });
    const btn = w.find("button");
    expect(btn.attributes("aria-haspopup")).toBe("dialog");
    await btn.trigger("click");
    await new Promise((r) => setTimeout(r, 20));
    expect(content()?.dataset.state).not.toBe("open");
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  // —— Anchor 模式 aria 接线 ——
  it("非 click 模式手动接线 aria 且指向面板 id", async () => {
    const w = mountPopover({ trigger: "hover", defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    const btn = w.find("button");
    expect(btn.attributes("aria-haspopup")).toBe("dialog");
    expect(btn.attributes("aria-expanded")).toBe("true");
    expect(btn.attributes("aria-controls")).toBe(content()!.id);
    w.unmount();
  });

  // —— portal ——
  it("portal=false 面板留在原地，默认 portal 到 body", async () => {
    const w = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    // 默认 portal：内容被传送到 body，wrapper 根元素内不可见
    expect(w.element.contains(content()!)).toBe(false);
    w.unmount();

    const w2 = mountPopover({ defaultOpen: true, portal: false });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(w2.element.contains(content()!)).toBe(true);
    w2.unmount();
  });

  // —— matchTriggerWidth（zag 把 sameWidth 的宽度样式落在 Positioner 上） ——
  it("matchTriggerWidth 面板宽度随触发器", async () => {
    const w = mountPopover({ defaultOpen: true, matchTriggerWidth: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(positioner()!.style.width).toBe("var(--reference-width)");
    w.unmount();
  });

  // —— zIndex（Positioner 内联 z-index 生效；默认态为 zag 的 var(--z-index)） ——
  it("zIndex 覆盖层级（内联 style）", async () => {
    const w = mountPopover({ defaultOpen: true, zIndex: 50 });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(positioner()!.style.zIndex).toBe("50");
    w.unmount();

    const w2 = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(positioner()!.style.zIndex).toBe("var(--z-index)");
    w2.unmount();
  });

  // —— 微前端 / shadow DOM 适配 ——
  it("显式 to：面板传送到指定容器", async () => {
    const target = document.createElement("div");
    target.id = "tele-target";
    document.body.appendChild(target);

    const w = mountPopover({ defaultOpen: true, to: "#tele-target" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(target.contains(content()!)).toBe(true);
    w.unmount();
    target.remove();
  });

  it("shadow DOM 沙箱自动降级：面板落在挂载容器（shadowRoot 内）而非主应用 body", async () => {
    const hostEl = document.createElement("div");
    document.body.appendChild(hostEl);
    const shadow = hostEl.attachShadow({ mode: "open" });
    const appContainer = document.createElement("div");
    shadow.appendChild(appContainer);

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { defaultOpen: true },
            {
              default: () => [h("button", { type: "button" }, "点我")],
              content: () => "气泡内容",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: appContainer });

    // shadow 内容无法被 document.querySelector 穿透，须从 shadowRoot 内查询
    const shadowContent = () =>
      shadow.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');
    await vi.waitFor(() => expect(shadowContent()?.dataset.state).toBe("open"));
    // 自动降级：content 在 shadowRoot 内（样式/主题变量继承链完整），未传送到主应用 body
    expect(shadow.contains(shadowContent()!)).toBe(true);
    expect(document.body.contains(shadowContent()!)).toBe(false);
    w.unmount();
    hostEl.remove();
  });

  // —— header / footer 插槽 ——
  it("header/footer 插槽渲染于内容区上下", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { defaultOpen: true },
            {
              default: () => [h("button", { type: "button" }, "点我")],
              header: () => "标题区",
              content: () => "气泡内容",
              footer: () => "底部区",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toContain("标题区");
    expect(content()!.textContent).toContain("底部区");
    w.unmount();
  });
});
