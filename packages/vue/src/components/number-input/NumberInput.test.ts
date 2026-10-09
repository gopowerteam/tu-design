import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { NumberInput, numberOrNull } from "./index";

const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="number-input"][data-part="root"]');
const inputEl = () =>
  document.querySelector<HTMLInputElement>('[data-scope="number-input"][data-part="input"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="number-input"]').forEach((n) => n.remove());
  vi.restoreAllMocks();
});

describe("NumberInput", () => {
  it("单组件内置步进按钮与输入框，数字 modelValue 格式化显示", () => {
    const w = mount(NumberInput, { props: { modelValue: 42 }, attachTo: document.body });
    expect(rootEl()).toBeTruthy();
    expect(inputEl()!.value).toBe("42");
    expect(
      document.querySelector('[data-scope="number-input"][data-part="decrement-trigger"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-scope="number-input"][data-part="increment-trigger"]'),
    ).toBeTruthy();
    w.unmount();
  });

  it("modelValue 为 null 时显示空", () => {
    const w = mount(NumberInput, { props: { modelValue: null }, attachTo: document.body });
    expect(inputEl()!.value).toBe("");
    w.unmount();
  });

  it("默认渲染减/加图标（svg）", () => {
    const w = mount(NumberInput, { props: { modelValue: 0 }, attachTo: document.body });
    const svgs = w.findAll(
      '[data-part="decrement-trigger"] svg, [data-part="increment-trigger"] svg',
    );
    expect(svgs.length).toBe(2);
    w.unmount();
  });

  it("点击加号发出 update:modelValue（valueAsNumber）", async () => {
    const onUpdate = vi.fn();
    const w = mount(NumberInput, {
      props: { modelValue: 42, "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    document
      .querySelector<HTMLElement>('[data-part="increment-trigger"]')!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(43));
    w.unmount();
  });

  it("点击减号发出 update:modelValue（valueAsNumber）", async () => {
    const onUpdate = vi.fn();
    const w = mount(NumberInput, {
      props: { modelValue: 42, "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    document
      .querySelector<HTMLElement>('[data-part="decrement-trigger"]')!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(41));
    w.unmount();
  });

  it("#decrement/#increment 插槽定制按钮内容", () => {
    const w = mount(NumberInput, {
      props: { modelValue: 0 },
      slots: { decrement: "减", increment: "加" },
      attachTo: document.body,
    });
    expect(w.find('[data-part="decrement-trigger"]')!.text()).toBe("减");
    expect(w.find('[data-part="increment-trigger"]')!.text()).toBe("加");
    w.unmount();
  });

  it("id 等 attrs 透传到内部真实 input（TFormControl 关联依赖）", () => {
    const w = mount(NumberInput, {
      props: { modelValue: 0 },
      attrs: { id: "age-input", "aria-describedby": "age-msg" },
      attachTo: document.body,
    });
    expect(inputEl()!.id).toBe("age-input");
    expect(inputEl()!.getAttribute("aria-describedby")).toBe("age-msg");
    w.unmount();
  });

  it("输入区 flex-1 填满两按钮之间（布局回归保护）", () => {
    const w = mount(NumberInput, { props: { modelValue: 1 }, attachTo: document.body });
    const cls = inputEl()!.className;
    expect(cls).toContain("flex-1");
    expect(cls).not.toContain("w-12");
    w.unmount();
  });

  it("numberOrNull：空串/NaN 归一为 null，正常值透传", () => {
    expect(numberOrNull({ value: "", valueAsNumber: Number.NaN })).toBe(null);
    expect(numberOrNull({ value: "abc", valueAsNumber: Number.NaN })).toBe(null);
    expect(numberOrNull({ value: "42", valueAsNumber: 42 })).toBe(42);
    expect(numberOrNull({ value: "1.5", valueAsNumber: 1.5 })).toBe(1.5);
    expect(numberOrNull({ value: "-3", valueAsNumber: -3 })).toBe(-3);
  });

  it("invalid=true 时 root 带 data-invalid", () => {
    const w = mount(NumberInput, {
      props: { modelValue: 1, invalid: true },
      attachTo: document.body,
    });
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
    w.unmount();
  });

  it("disabled=true 时 root 带 data-disabled", () => {
    const w = mount(NumberInput, {
      props: { modelValue: 1, disabled: true },
      attachTo: document.body,
    });
    expect(rootEl()!.hasAttribute("data-disabled")).toBe(true);
    w.unmount();
  });
});
