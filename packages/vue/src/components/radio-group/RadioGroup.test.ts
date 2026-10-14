import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { RadioGroup, RadioGroupItem } from "./index";

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

function mountGroup(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(RadioGroup, props, {
          default: () => [
            h(RadioGroupItem, { value: "weekly" }, () => "每周"),
            h(RadioGroupItem, { value: "monthly" }, () => "每月"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("RadioGroup", () => {
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

  it("defaultvalue 初始选中", async () => {
    const w = mountGroup({ defaultValue: "weekly" });
    await vi.waitFor(() => expect(itemControls()[0]!.dataset.state).toBe("checked"));
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("weekly");
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            RadioGroup,
            { value: value.value, "onUpdate:value": (v: string) => (value.value = v) },
            {
              default: () => [
                h(RadioGroupItem, { value: "weekly" }, () => "每周"),
                h(RadioGroupItem, { value: "monthly" }, () => "每月"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("monthly"));
    w.unmount();
  });

  it("RadioGroupItem 渲染圆形控件与文本", async () => {
    const w = mountGroup();
    expect(itemControls()[0]!.className).toContain("rounded-full");
    expect(items()[0]!.textContent).toContain("每周");
    w.unmount();
  });

  it("ItemControl 带居中布局类（圆点居中的结构保证）", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));
    const cls = itemControls()[0]!.className.split(/\s+/);
    expect(cls).toContain("flex");
    expect(cls).toContain("items-center");
    expect(cls).toContain("justify-center");
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

  it("不传 value 且不监听事件时点击仍可切换（内部 ref 非受控语义）", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("options 对象数组渲染，disabled 项不响应", async () => {
    const onUpdate = vi.fn();
    const w = mount(RadioGroup, {
      props: {
        options: [
          { label: "每周", value: "weekly" },
          { label: "每月", value: "monthly", disabled: true },
        ],
        "onUpdate:value": onUpdate,
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.textContent).toContain("每周");
    expect(items()[1]!.textContent).toContain("每月");

    items()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(itemControls()[1]!.dataset.state).toBe("unchecked");

    items()[0]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("weekly"));
    w.unmount();
  });

  it("options 字符串快捷写法", async () => {
    const w = mount(RadioGroup, {
      props: { options: ["a", "b"] },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.textContent).toContain("a");
    expect(items()[1]!.textContent).toContain("b");
    w.unmount();
  });

  it("插槽优先于 options 并在 DEV 警告", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(RadioGroup, {
      props: { options: [{ label: "选项A", value: "a" }] },
      slots: { default: () => h(RadioGroupItem, { value: "custom" }, () => "自定义") },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(1));
    expect(items()[0]!.textContent).toContain("自定义");
    expect(w.text()).not.toContain("选项A");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    w.unmount();
  });
});
