import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PinInput } from "./index";

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

describe("PinInput", () => {
  it("length 默认 4 格，modelValue 逐格透传", () => {
    const w = mount(PinInput, {
      props: { modelValue: ["1", "2", "", ""] },
      attachTo: document.body,
    });
    expect(rootEl()).toBeTruthy();
    const inputs = inputEls();
    expect(inputs.length).toBe(4);
    expect(inputs[0]!.value).toBe("1");
    expect(inputs[1]!.value).toBe("2");
    expect(inputs[2]!.value).toBe("");
    w.unmount();
  });

  it("length=6 渲染 6 格", () => {
    const w = mount(PinInput, { props: { modelValue: [], length: 6 }, attachTo: document.body });
    expect(inputEls().length).toBe(6);
    w.unmount();
  });

  it("#separator 插槽在格间渲染 length-1 次", () => {
    const w = mount(PinInput, {
      props: { modelValue: [], length: 4 },
      slots: { separator: "<span class='sep'>–</span>" },
      attachTo: document.body,
    });
    expect(w.findAll(".sep").length).toBe(3);
    w.unmount();
  });

  it("otp=true 时 autocomplete 为 one-time-code", () => {
    const w = mount(PinInput, { props: { modelValue: [], otp: true }, attachTo: document.body });
    expect(inputEls()[0]!.getAttribute("autocomplete")).toBe("one-time-code");
    w.unmount();
  });

  it("mask=true 时格输入为密码形态", () => {
    const w = mount(PinInput, { props: { modelValue: [], mask: true }, attachTo: document.body });
    expect(inputEls()[0]!.type).toBe("password");
    w.unmount();
  });

  it("type=numeric 时 inputMode 为 numeric", () => {
    const w = mount(PinInput, {
      props: { modelValue: [], type: "numeric" },
      attachTo: document.body,
    });
    expect(inputEls()[0]!.getAttribute("inputmode")).toBe("numeric");
    w.unmount();
  });

  it("id 等 attrs 透传到首格 input", () => {
    const w = mount(PinInput, {
      props: { modelValue: [] },
      attrs: { id: "code-input", "aria-describedby": "code-msg" },
      attachTo: document.body,
    });
    expect(inputEls()[0]!.id).toBe("code-input");
    expect(inputEls()[0]!.getAttribute("aria-describedby")).toBe("code-msg");
    // 仅首格透传：第二格保留 ark 生成的内部 id
    expect(inputEls()[1]!.id).not.toBe("code-input");
    w.unmount();
  });

  it("invalid=true 时 root 带 data-invalid", () => {
    const w = mount(PinInput, {
      props: { modelValue: [], invalid: true },
      attachTo: document.body,
    });
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
    w.unmount();
  });

  it("disabled=true 时 root 带 data-disabled", () => {
    const w = mount(PinInput, {
      props: { modelValue: [], disabled: true },
      attachTo: document.body,
    });
    expect(rootEl()!.hasAttribute("data-disabled")).toBe(true);
    w.unmount();
  });
});
