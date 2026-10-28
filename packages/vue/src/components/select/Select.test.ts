import { mount, type DOMWrapper } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Select } from "./index";
import type { SelectItemOption } from "./index";

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

function mountSelect(props: Record<string, unknown> = {}, slots: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Select, { items: FRAMEWORKS, ...props }, slots);
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

async function openList(w: { find: (sel: string) => DOMWrapper<Element> }) {
  await w.find('[data-part="trigger"]').trigger("click");
  await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
}

describe("Select", () => {
  it("初始显示默认 placeholder，点击 Trigger 打开列表渲染全部选项", async () => {
    const w = mountSelect();
    expect(trigger()!.textContent).toContain("请选择");

    await openList(w);
    expect(items().length).toBe(3);
    w.unmount();
  });

  it("placeholder 可自定义，选中后回显选中值", async () => {
    const onUpdate = vi.fn();
    const w = mountSelect({ placeholder: "选择框架", "onUpdate:modelValue": onUpdate });
    expect(trigger()!.textContent).toContain("选择框架");

    await openList(w);
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

  it("v-model 双向：受控回显 + 选择后写回", async () => {
    const value = ref("React");
    const Host = defineComponent({
      setup() {
        return () =>
          h(Select, {
            items: FRAMEWORKS,
            modelValue: value.value,
            "onUpdate:modelValue": (v: string) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("React"));

    await openList(w);
    const svelte = items().find((el) => el.textContent?.includes("Svelte"))!;
    hover(svelte);
    svelte.click();
    await vi.waitFor(() => expect(value.value).toBe("Svelte"));
    w.unmount();
  });

  it("非受控 defaultValue 提供初始回显", async () => {
    const w = mountSelect({ defaultValue: "Svelte" });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("Svelte"));
    w.unmount();
  });

  it("受控 open：open=true 恒开，点击 Trigger 仅上报 update:open", async () => {
    const onOpenUpdate = vi.fn();
    const w = mountSelect({ open: true, "onUpdate:open": onOpenUpdate });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(onOpenUpdate).toHaveBeenCalledWith(false));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    w.unmount();
  });

  it("非受控开合：Escape 关闭列表", async () => {
    const w = mountSelect();
    await openList(w);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("disabled 项带 data-disabled 且点击不更新值", async () => {
    const onUpdate = vi.fn();
    const cities: (string | SelectItemOption)[] = [
      "杭州",
      { label: "深圳", value: "sz", disabled: true },
    ];
    const w = mountSelect({ items: cities, "onUpdate:modelValue": onUpdate });

    await openList(w);
    const sz = items().find((el) => el.textContent?.includes("深圳"))!;
    expect("disabled" in sz.dataset).toBe(true);

    hover(sz);
    sz.click();
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("#item 插槽逃生口：作用域含 item/label/selected，回显仍取 collection label", async () => {
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
              item: (scope: { item: unknown; label: string; selected: boolean }) =>
                h("span", { "data-testid": "custom-item" }, [
                  `${scope.label}${scope.selected ? "!" : ""}`,
                ]),
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await openList(w);
    const rendered = items().map((el) => el.textContent);
    expect(rendered).toEqual(["Vue", "React!", "Svelte"]);
    // 回显与插槽解耦：ValueText 取 collection 的 label
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("React"));
    w.unmount();
  });
});
