import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Popover } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

const trigger = () => document.querySelector<HTMLElement>('[data-part="trigger"]');

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
});
