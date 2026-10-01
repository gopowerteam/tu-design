import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValueText } from "./index";

const FRAMEWORKS = ["Vue", "React", "Svelte"];

const trigger = () =>
  document.querySelector<HTMLElement>('[data-scope="select"][data-part="trigger"]');
const content = () =>
  document.querySelector<HTMLElement>('[data-scope="select"][data-part="content"]');
const items = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="select"][data-part="item"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="select"]').forEach((n) => n.remove());
});

interface HostOptions {
  props?: Record<string, unknown>;
}

function mountSelect(options: HostOptions = {}) {
  const { props = {} } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          Select,
          { items: FRAMEWORKS, ...props },
          {
            default: () => [
              h(SelectTrigger, null, () => h(SelectValueText, { placeholder: "选择框架" })),
              h(SelectContent, null, () =>
                FRAMEWORKS.map((f) => h(SelectItem, { item: f, key: f })),
              ),
            ],
          },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

// zag 的 item 选择依赖高亮：真实交互是先悬停（pointermove）再点击
function hover(el: Element) {
  const down = new MouseEvent("pointerdown", { bubbles: true });
  Object.defineProperty(down, "pointerType", { value: "mouse" });
  el.dispatchEvent(down);
  const move = new MouseEvent("pointermove", { bubbles: true });
  Object.defineProperty(move, "pointerType", { value: "mouse" });
  el.dispatchEvent(move);
}

describe("Select", () => {
  it("初始显示 placeholder，点击 Trigger 打开列表", async () => {
    const w = mountSelect();
    expect(trigger()!.textContent).toContain("选择框架");

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(items().length).toBe(3);
    w.unmount();
  });

  it("悬停并点击选项后更新值并关闭", async () => {
    const onUpdate = vi.fn();
    const w = mountSelect({ props: { "onUpdate:modelValue": onUpdate } });

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    const vueItem = items().find((el) => el.textContent?.includes("Vue"))!;
    hover(vueItem);
    vueItem.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("Vue"));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("Vue"));
    w.unmount();
  });

  it("v-model 受控回显", async () => {
    const value = ref("React");
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Select,
            {
              items: FRAMEWORKS,
              modelValue: value.value,
              "onUpdate:modelValue": (v: string) => (value.value = v),
            },
            {
              default: () => [
                h(SelectTrigger, null, () => h(SelectValueText, { placeholder: "选择框架" })),
                h(SelectContent, null, () =>
                  FRAMEWORKS.map((f) => h(SelectItem, { item: f, key: f })),
                ),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("React"));

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    const svelte = items().find((el) => el.textContent?.includes("Svelte"))!;
    hover(svelte);
    svelte.click();
    await vi.waitFor(() => expect(value.value).toBe("Svelte"));
    w.unmount();
  });

  it("Escape 关闭列表", async () => {
    const w = mountSelect();
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });
});
