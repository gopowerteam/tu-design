import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PasswordInput, PasswordInputInput, PasswordInputVisibilityTrigger } from "./index";

const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="password-input"][data-part="root"]');
const inputEl = () =>
  document.querySelector<HTMLInputElement>('[data-scope="password-input"][data-part="input"]');
const triggerEl = () =>
  document.querySelector<HTMLElement>(
    '[data-scope="password-input"][data-part="visibility-trigger"]',
  );

afterEach(() => {
  document.body.querySelectorAll('[data-scope="password-input"]').forEach((n) => n.remove());
  vi.restoreAllMocks();
});

function mountPasswordInput(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(PasswordInput, props, {
          default: () => [
            h(PasswordInputInput),
            h(PasswordInputVisibilityTrigger, () => "切换可见"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("PasswordInput", () => {
  it("渲染 root/input/visibility-trigger，默认不可见（type=password）", () => {
    mountPasswordInput({ modelValue: "secret" });
    expect(rootEl()).toBeTruthy();
    expect(inputEl()).toBeTruthy();
    expect(triggerEl()).toBeTruthy();
    expect(inputEl()!.type).toBe("password");
  });

  it("modelValue 透传显示", () => {
    mountPasswordInput({ modelValue: "s3cret" });
    expect(inputEl()!.value).toBe("s3cret");
  });

  it("原生 input 事件发出 update:modelValue", async () => {
    const onUpdate = vi.fn();
    mountPasswordInput({ modelValue: "", "onUpdate:modelValue": onUpdate });
    inputEl()!.value = "typed";
    inputEl()!.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("typed"));
  });

  it("visible=true 时明文显示（type=text）", () => {
    mountPasswordInput({ modelValue: "x", visible: true });
    expect(inputEl()!.type).toBe("text");
  });

  it("点击 visibility-trigger 发出 update:visible(true)", async () => {
    const onVisible = vi.fn();
    mountPasswordInput({ modelValue: "x", "onUpdate:visible": onVisible });
    triggerEl()!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await vi.waitFor(() => expect(onVisible).toHaveBeenCalledWith(true));
  });

  it("autoComplete 默认 current-password", () => {
    mountPasswordInput({ modelValue: "x" });
    expect(inputEl()!.getAttribute("autocomplete")).toBe("current-password");
  });

  it("invalid=true 时 root 带 data-invalid", () => {
    mountPasswordInput({ modelValue: "x", invalid: true });
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
  });

  it("disabled=true 时 root 带 data-disabled", () => {
    mountPasswordInput({ modelValue: "x", disabled: true });
    expect(rootEl()!.hasAttribute("data-disabled")).toBe(true);
  });

  it("Input/VisibilityTrigger 缺失 Root 上下文时开发期告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(
      defineComponent({
        setup: () => () => [h(PasswordInputInput), h(PasswordInputVisibilityTrigger)],
      }),
      { attachTo: document.body },
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("<PasswordInputInput> 必须在 <PasswordInput> 内使用"),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("<PasswordInputVisibilityTrigger> 必须在 <PasswordInput> 内使用"),
    );
    w.unmount();
  });
});
