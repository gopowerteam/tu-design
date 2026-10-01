import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Tooltip, TooltipContent, TooltipTrigger } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="tooltip"][data-part="content"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="tooltip"]').forEach((n) => n.remove());
});

function mountTooltip(
  props: Record<string, unknown> = {},
  contentProps: Record<string, unknown> = {},
) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          Tooltip,
          { delayDuration: 0, ...props },
          {
            default: () => [
              h(TooltipTrigger, null, () => "悬停我"),
              h(TooltipContent, contentProps, () => "提示文本"),
            ],
          },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Tooltip", () => {
  it("pointermove 显示、pointerleave 隐藏", async () => {
    const w = mountTooltip();
    const trigger = w.find('[data-part="trigger"]');

    await trigger.trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toContain("提示文本");

    await trigger.trigger("pointerleave");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("v-model:open 受控", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tooltip,
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              default: () => [
                h(TooltipTrigger, null, () => "悬停我"),
                h(TooltipContent, null, () => "提示文本"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    await w.find('[data-part="trigger"]').trigger("pointerleave");
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("TooltipTrigger asChild 合并到子元素", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tooltip,
            { delayDuration: 0 },
            {
              default: () => [
                h(TooltipTrigger, { asChild: true }, () =>
                  h("a", { class: "link", href: "/help" }, "帮助"),
                ),
                h(TooltipContent, null, () => "前往帮助"),
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

    await a.trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    w.unmount();
  });

  it("内容应用变体类", async () => {
    const w = mountTooltip({}, { class: "max-w-40" });
    await w.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.className).toContain("bg-primary");
    expect(content()!.className).toContain("max-w-40");
    w.unmount();
  });
});
