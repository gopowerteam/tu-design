import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PinInput, PinInputInput } from "./index";

const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="pin-input"][data-part="root"]');
const inputEls = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>('[data-scope="pin-input"][data-part="input"]'),
  );

afterEach(() => {
  document.body.querySelectorAll('[data-scope="pin-input"]').forEach((n) => n.remove());
  vi.restoreAllMocks();
});

function mountPinInput(props: Record<string, unknown> = {}, cells = 4) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(PinInput, props, {
          default: () =>
            Array.from({ length: cells }, (_, i) => h(PinInputInput, { key: i, index: i })),
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("PinInput", () => {
  it("渲染 root 与 N 个格输入，modelValue 逐格透传", () => {
    mountPinInput({ modelValue: ["1", "2", "", ""] });
    expect(rootEl()).toBeTruthy();
    const inputs = inputEls();
    expect(inputs.length).toBe(4);
    expect(inputs[0]!.value).toBe("1");
    expect(inputs[1]!.value).toBe("2");
    expect(inputs[2]!.value).toBe("");
  });

  it("格数由 Input 子件数量决定", () => {
    mountPinInput({ modelValue: [] }, 6);
    expect(inputEls().length).toBe(6);
  });

  it("otp=true 时 autocomplete 为 one-time-code", () => {
    mountPinInput({ modelValue: [], otp: true });
    expect(inputEls()[0]!.getAttribute("autocomplete")).toBe("one-time-code");
  });

  it("mask=true 时格输入为密码形态", () => {
    mountPinInput({ modelValue: [], mask: true });
    expect(inputEls()[0]!.type).toBe("password");
  });

  it("type=numeric 时 inputMode 为 numeric", () => {
    mountPinInput({ modelValue: [], type: "numeric" });
    expect(inputEls()[0]!.getAttribute("inputmode")).toBe("numeric");
  });

  it("invalid=true 时 root 带 data-invalid", () => {
    mountPinInput({ modelValue: [], invalid: true });
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
  });

  it("disabled=true 时 root 带 data-disabled", () => {
    mountPinInput({ modelValue: [], disabled: true });
    expect(rootEl()!.hasAttribute("data-disabled")).toBe(true);
  });

  it("Input 缺失 Root 上下文时开发期告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(defineComponent({ setup: () => () => h(PinInputInput) }), {
      attachTo: document.body,
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("<PinInputInput> 必须在 <PinInput> 内使用"),
    );
    w.unmount();
  });
});
