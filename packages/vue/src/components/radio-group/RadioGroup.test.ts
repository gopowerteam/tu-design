import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { RadioGroup } from "./index";

const items = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item"]'),
];
const itemControls = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item-control"]'),
];
const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="radio-group"][data-part="root"]');
const hiddenInputs = () => [
  // zag 的隐藏 input 不带 data-part，只有 data-ownedby；用组 root 内的 radio input 定位
  ...document.querySelectorAll<HTMLInputElement>('[data-part="root"] input[type="radio"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="radio-group"]').forEach((n) => n.remove());
});

const baseItems = [
  { label: "每周", value: "weekly" },
  { label: "每月", value: "monthly" },
];

function mountGroup(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(RadioGroup, { items: baseItems, ...props });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("RadioGroup", () => {
  it("items 数据驱动渲染选项文本与圆形控件", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.textContent).toContain("每周");
    expect(items()[1]!.textContent).toContain("每月");
    expect(items()[0]!.className).toContain("flex");
    expect(items()[0]!.className).toContain("items-center");
    expect(itemControls()[0]!.className).toContain("rounded-full");
    w.unmount();
  });

  it("点击选中并发出 update:value，单选互斥", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ "onUpdate:value": onUpdate });

    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    items()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("monthly"));
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("defaultValue 初始选中", async () => {
    const w = mountGroup({ defaultValue: "weekly" });
    await vi.waitFor(() => expect(itemControls()[0]!.dataset.state).toBe("checked"));
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("weekly");
    const Host = defineComponent({
      setup() {
        return () =>
          h(RadioGroup, {
            items: baseItems,
            value: value.value,
            "onUpdate:value": (v: string) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("monthly"));
    w.unmount();
  });

  it("不传 value 且不监听事件时点击仍可切换（内部 ref 非受控语义）", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("items 项 disabled 不可选，其余可选", async () => {
    const onUpdate = vi.fn();
    const w = mount(RadioGroup, {
      props: {
        items: [
          { label: "每周", value: "weekly" },
          { label: "每月", value: "monthly", disabled: true },
        ],
        "onUpdate:value": onUpdate,
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(itemControls()[1]!.dataset.state).toBe("unchecked");

    items()[0]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("weekly"));
    w.unmount();
  });

  it("整组 disabled 全部不可选", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ disabled: true, "onUpdate:value": onUpdate });
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[0]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("#item 插槽接管单项渲染，作用域提供 item 与 checked，隐藏 input 保留", async () => {
    const w = mount(RadioGroup, {
      props: { items: baseItems, name: "plan" },
      slots: {
        item: ({ item, checked }: { item: { label: string; value: string }; checked: boolean }) =>
          h("span", { "data-testid": "custom-item" }, `${item.label}-${checked}`),
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    // 内置圆点控件不再渲染，自定义内容生效
    expect(itemControls().length).toBe(0);
    expect(document.body.textContent).toContain("每周-false");

    items()[1]!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("每月-true"));

    // 表单语义不丢失：隐藏 input 仍随 items 渲染
    expect(hiddenInputs().length).toBe(2);
    expect(hiddenInputs()[0]!.name).toBe("plan");
    w.unmount();
  });

  it("item.class 应用到选项根元素", async () => {
    const w = mount(RadioGroup, {
      props: {
        items: [{ label: "每周", value: "weekly", class: "text-primary" }, baseItems[1]!],
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.className).toContain("text-primary");
    expect(items()[1]!.className).not.toContain("text-primary");
    w.unmount();
  });

  it("invalid=true 时 root 与 item-control 级联 data-invalid，控件带 destructive 样式", async () => {
    const w = mountGroup({ invalid: true });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
    expect(itemControls()[0]!.hasAttribute("data-invalid")).toBe(true);
    expect(itemControls()[0]!.className).toContain("data-invalid:border-destructive");
    w.unmount();
  });

  it("name 透传到隐藏 input，供原生表单提交", async () => {
    const w = mountGroup({ name: "plan" });
    await vi.waitFor(() => expect(hiddenInputs().length).toBe(2));
    expect(hiddenInputs()[0]!.name).toBe("plan");
    expect(hiddenInputs()[0]!.type).toBe("radio");
    w.unmount();
  });

  it("required/readOnly 透传", async () => {
    const w = mountGroup({ required: true, readOnly: true });
    await vi.waitFor(() => expect(hiddenInputs().length).toBe(2));
    expect(hiddenInputs()[0]!.required).toBe(true);
    expect(rootEl()!.getAttribute("aria-readonly")).toBe("true");
    w.unmount();
  });

  it("horizontal 方向根元素应用水平排列类", () => {
    const w = mount(RadioGroup, {
      props: { items: baseItems, orientation: "horizontal" },
      attachTo: document.body,
    });
    const root = rootEl()!;
    expect(root.className).toContain("grid-flow-col");
    expect(root.className).toContain("auto-cols-max");
    w.unmount();

    const w2 = mount(RadioGroup, { props: { items: baseItems }, attachTo: document.body });
    const root2 = rootEl()!;
    expect(root2.className).not.toContain("grid-flow-col");
    w2.unmount();
  });
});
