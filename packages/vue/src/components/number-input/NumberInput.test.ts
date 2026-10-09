import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  NumberInput,
  NumberInputDecrement,
  NumberInputIncrement,
  NumberInputInput,
  numberOrNull,
} from "./index";

const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="number-input"][data-part="root"]');
const inputEl = () =>
  document.querySelector<HTMLInputElement>('[data-scope="number-input"][data-part="input"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="number-input"]').forEach((n) => n.remove());
  vi.restoreAllMocks();
});

function mountNumberInput(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(NumberInput, props, {
          default: () => [
            h(NumberInputDecrement, () => "−"),
            h(NumberInputInput),
            h(NumberInputIncrement, () => "+"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("NumberInput", () => {
  it("渲染 root/input/decrement/increment，数字 modelValue 格式化显示", () => {
    mountNumberInput({ modelValue: 42 });
    expect(rootEl()).toBeTruthy();
    expect(inputEl()!.value).toBe("42");
    expect(
      document.querySelector('[data-scope="number-input"][data-part="decrement-trigger"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('[data-scope="number-input"][data-part="increment-trigger"]'),
    ).toBeTruthy();
  });

  it("modelValue 为 null 时显示空", () => {
    mountNumberInput({ modelValue: null });
    expect(inputEl()!.value).toBe("");
  });

  it("点击 Increment 发出 update:modelValue（valueAsNumber）", async () => {
    const onUpdate = vi.fn();
    mountNumberInput({ modelValue: 42, "onUpdate:modelValue": onUpdate });
    document
      .querySelector<HTMLElement>('[data-part="increment-trigger"]')!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(43));
  });

  it("点击 Decrement 发出 update:modelValue（valueAsNumber）", async () => {
    const onUpdate = vi.fn();
    mountNumberInput({ modelValue: 42, "onUpdate:modelValue": onUpdate });
    document
      .querySelector<HTMLElement>('[data-part="decrement-trigger"]')!
      .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(41));
  });

  it("numberOrNull：空串/NaN 归一为 null，正常值透传", () => {
    expect(numberOrNull({ value: "", valueAsNumber: Number.NaN })).toBe(null);
    expect(numberOrNull({ value: "abc", valueAsNumber: Number.NaN })).toBe(null);
    expect(numberOrNull({ value: "42", valueAsNumber: 42 })).toBe(42);
    expect(numberOrNull({ value: "1.5", valueAsNumber: 1.5 })).toBe(1.5);
    expect(numberOrNull({ value: "-3", valueAsNumber: -3 })).toBe(-3);
  });

  it("invalid=true 时 root 带 data-invalid", () => {
    mountNumberInput({ modelValue: 1, invalid: true });
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
  });

  it("disabled=true 时 root 带 data-disabled", () => {
    mountNumberInput({ modelValue: 1, disabled: true });
    expect(rootEl()!.hasAttribute("data-disabled")).toBe(true);
  });

  it("子组件缺失 Root 上下文时开发期告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(defineComponent({ setup: () => () => h(NumberInputInput) }), {
      attachTo: document.body,
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("<NumberInputInput> 必须在 <NumberInput> 内使用"),
    );
    w.unmount();
  });
});
