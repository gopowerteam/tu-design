import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Drawer } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="drawer"][data-part="content"]');
const title = () => document.querySelector<HTMLElement>('[data-scope="drawer"][data-part="title"]');
const description = () =>
  document.querySelector<HTMLElement>('[data-scope="drawer"][data-part="description"]');
const closeTrigger = () =>
  document.querySelector<HTMLElement>('[data-scope="drawer"][data-part="close-trigger"]');

interface Slots {
  trigger?: () => unknown;
  default?: () => unknown;
  title?: () => unknown;
  description?: () => unknown;
  footer?: (ctx: { close: () => void }) => unknown;
}

function mountDrawer(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Drawer, props, slots as never);
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 全量插槽：#trigger + title/description props + 默认插槽 + #footer(close) */
function mountFull(props: Record<string, unknown> = {}) {
  return mountDrawer(
    { title: "筛选条件", description: "按需组合以下条件", ...props },
    {
      trigger: () => h("button", { type: "button", class: "open-btn" }, "打开"),
      default: () => h("p", { class: "body-text" }, "内容区"),
      footer: ({ close }: { close: () => void }) =>
        h("button", { type: "button", class: "cancel-btn", onClick: close }, "取消"),
    },
  );
}

async function openDrawer(w: ReturnType<typeof mountFull>) {
  await w.find("button.open-btn").trigger("click");
  await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="drawer"]').forEach((n) => n.remove());
});

describe("Drawer", () => {
  it("#trigger 打开：asChild 语义合并到插槽元素，面板进入 open 态，遮罩出现", async () => {
    const w = mountFull();
    expect(content()!.dataset.state).toBe("closed");

    const btn = w.find("button.open-btn");
    expect(btn.attributes("data-part")).toBe("trigger");
    expect(btn.attributes("aria-controls")).toBeDefined();

    await openDrawer(w);
    expect(content()!.hasAttribute("hidden")).toBe(false);
    expect(document.querySelector('[data-scope="drawer"][data-part="backdrop"]')).not.toBeNull();
    w.unmount();
  });

  it("title/description props 渲染文案，#title/#description 插槽可覆盖", async () => {
    const w = mountFull();
    await openDrawer(w);
    expect(title()!.textContent).toContain("筛选条件");
    expect(description()!.textContent).toContain("按需组合以下条件");
    w.unmount();

    const w2 = mountDrawer(
      { title: "属性标题", description: "属性描述" },
      {
        trigger: () => h("button", { type: "button" }, "打开"),
        title: () => "插槽标题",
        description: () => "插槽描述",
      },
    );
    await w2.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    expect(title()!.textContent).toContain("插槽标题");
    expect(description()!.textContent).toContain("插槽描述");
    w2.unmount();
  });

  it("默认插槽渲染正文，#footer 作用域 close 关闭抽屉", async () => {
    const w = mountFull();
    await openDrawer(w);
    expect(content()!.querySelector(".body-text")!.textContent).toBe("内容区");

    await w.find("button.cancel-btn").trigger("click");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("v-model:open 受控：触发器回写 true，Escape/程序化开关双向同步", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Drawer,
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              trigger: () => h("button", { type: "button" }, "打开"),
              default: () => h("p", "受控"),
              title: () => "受控",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => expect(open.value).toBe(false));

    open.value = true;
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    w.unmount();
  });

  it("showCloseButton=false 不渲染内置关闭按钮，默认渲染且 aria-label=关闭", async () => {
    const w = mountFull({ showCloseButton: false });
    await openDrawer(w);
    expect(closeTrigger()).toBeNull();
    w.unmount();

    const w2 = mountFull();
    await openDrawer(w2);
    expect(closeTrigger()!.getAttribute("aria-label")).toBe("关闭");
    w2.unmount();
  });

  it.each([
    ["right", "slide-in-from-right", "slide-out-to-right", "sm:w-96"],
    ["left", "slide-in-from-left", "slide-out-to-left", "sm:w-96"],
    ["top", "slide-in-from-top", "slide-out-to-top", "sm:h-80"],
    ["bottom", "slide-in-from-bottom", "slide-out-to-bottom", "sm:h-80"],
  ] as const)(
    "placement=%s：动画 class 随方向自适应，尺寸档位（sm: 前缀）生效",
    (placement, slideIn, slideOut, sizeClass) => {
      const w = mountDrawer({ placement });
      const el = content()!;
      expect(el.className).toContain(slideIn);
      expect(el.className).toContain(slideOut);
      expect(el.className).toContain(sizeClass);
      w.unmount();
    },
  );

  it("size 档位：侧向映射宽度（sm/lg），顶/底向映射高度，均带 sm: 前缀", () => {
    const wSide = mountDrawer({ size: "lg" });
    const side = content()!;
    expect(side.className).toContain("sm:w-[40rem]");
    // classList 不含无前缀档位类（确保档位只由 sm: 断点提供）
    expect(side.classList.contains("w-[40rem]")).toBe(false);
    wSide.unmount();

    const wVertical = mountDrawer({ placement: "bottom", size: "sm" });
    expect(content()!.className).toContain("sm:h-64");
    wVertical.unmount();
  });

  it("移动端回退：档位类与全宽类共存（不同断点前缀不被 tw-merge 吞并）", () => {
    // 侧向：w-full（无前缀，移动端全宽）+ sm:w-96（桌面档位）同时存在
    const wSide = mountDrawer({ placement: "right" });
    const side = content()!;
    expect(side.className).toContain("w-full");
    expect(side.className).toContain("sm:w-96");
    // 不允许出现 sm:w-full（会与档位类竞争导致桌面全宽）
    expect(side.className).not.toContain("sm:w-full");
    wSide.unmount();

    // 顶/底向：h-full + sm:h-80 同时存在
    const wVertical = mountDrawer({ placement: "bottom" });
    const vertical = content()!;
    expect(vertical.className).toContain("h-full");
    expect(vertical.className).toContain("sm:h-80");
    expect(vertical.className).not.toContain("sm:h-full");
    wVertical.unmount();
  });

  it("无 title/description 时不渲染对应 DOM", async () => {
    const w = mountDrawer(
      {},
      {
        trigger: () => h("button", { type: "button" }, "打开"),
        default: () => h("p", "纯内容"),
      },
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    expect(title()).toBeNull();
    expect(description()).toBeNull();
    w.unmount();
  });

  it("aria 接线：content 的 aria-labelledby/describedby 指向 title/description", async () => {
    const w = mountFull();
    await openDrawer(w);
    expect(content()!.getAttribute("aria-labelledby")).toBe(title()!.id);
    expect(content()!.getAttribute("aria-describedby")).toBe(description()!.id);
    w.unmount();
  });
});
