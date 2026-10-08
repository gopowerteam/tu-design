import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Popover, PopoverContent, PopoverTrigger } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
});

function mountPopover(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(Popover, props, {
          default: () => [
            h(PopoverTrigger, null, () => "点我"),
            h(PopoverContent, null, () => "气泡内容"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Popover", () => {
  it("defaultOpen 初始展开，内容渲染", async () => {
    const w = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toContain("气泡内容");
    w.unmount();
  });

  it("点击 trigger 切换并发出 update:open", async () => {
    const onUpdate = vi.fn();
    const w = mountPopover({ "onUpdate:open": onUpdate });
    const trigger = w.find('[data-part="trigger"]');

    await trigger.trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(onUpdate).toHaveBeenCalledWith(true);

    await trigger.trigger("click");
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
              default: () => [
                h(PopoverTrigger, null, () => "点我"),
                h(PopoverContent, null, () => "气泡内容"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("PopoverTrigger asChild 合并到子元素", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { defaultOpen: true },
            {
              default: () => [
                h(PopoverTrigger, { asChild: true }, () =>
                  h("a", { class: "link", href: "/help" }, "帮助"),
                ),
                h(PopoverContent, null, () => "前往帮助"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/help");
    expect(a.attributes("data-part")).toBe("trigger");
    w.unmount();
  });
});
