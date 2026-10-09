import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PasswordInput } from "./index";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("PasswordInput", () => {
  it("单组件内置输入框与切换按钮，默认不可见（type=password）", () => {
    const w = mount(PasswordInput, { props: { modelValue: "secret" }, attachTo: document.body });
    const input = w.find("input");
    expect(input.exists()).toBe(true);
    expect(input.attributes("type")).toBe("password");
    expect(w.find("button").exists()).toBe(true);
    w.unmount();
  });

  it("modelValue 透传显示", () => {
    const w = mount(PasswordInput, { props: { modelValue: "s3cret" }, attachTo: document.body });
    expect(w.find("input").element.value).toBe("s3cret");
    w.unmount();
  });

  it("原生 input 事件发出 update:modelValue（非受控内部维护）", async () => {
    const onUpdate = vi.fn();
    const w = mount(PasswordInput, {
      props: { modelValue: "", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find("input").setValue("typed");
    expect(onUpdate).toHaveBeenCalledWith("typed");
    w.unmount();
  });

  it("visible=true 时明文显示（type=text）", () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "x", visible: true },
      attachTo: document.body,
    });
    expect(w.find("input").attributes("type")).toBe("text");
    w.unmount();
  });

  it("点击按钮发出 update:visible(true)，再点发出 false", async () => {
    const onVisible = vi.fn();
    const w = mount(PasswordInput, {
      props: { modelValue: "x", "onUpdate:visible": onVisible },
      attachTo: document.body,
    });
    await w.find("button").trigger("click");
    expect(onVisible).toHaveBeenLastCalledWith(true);
    await w.find("button").trigger("click");
    expect(onVisible).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("非受控模式下点击按钮内部切换 type", async () => {
    const w = mount(PasswordInput, { props: {}, attachTo: document.body });
    expect(w.find("input").attributes("type")).toBe("password");
    await w.find("button").trigger("click");
    expect(w.find("input").attributes("type")).toBe("text");
    w.unmount();
  });

  it("autoComplete 默认 current-password，可覆盖", () => {
    const w = mount(PasswordInput, { props: { modelValue: "x" }, attachTo: document.body });
    expect(w.find("input").attributes("autocomplete")).toBe("current-password");
    w.unmount();
    const w2 = mount(PasswordInput, {
      props: { modelValue: "x", autoComplete: "new-password" },
      attachTo: document.body,
    });
    expect(w2.find("input").attributes("autocomplete")).toBe("new-password");
    w2.unmount();
  });

  it("切换按钮带 aria-label 与 aria-pressed", async () => {
    const w = mount(PasswordInput, { props: { modelValue: "x" }, attachTo: document.body });
    const button = w.find("button");
    expect(button.attributes("aria-label")).toBe("显示密码");
    expect(button.attributes("aria-pressed")).toBe("false");
    await button.trigger("click");
    expect(w.find("button").attributes("aria-label")).toBe("隐藏密码");
    expect(w.find("button").attributes("aria-pressed")).toBe("true");
    w.unmount();
  });

  it("#visibility-icon 插槽定制图标（接收 visible 作用域）", async () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "x" },
      slots: {
        "visibility-icon": `<template #visibility-icon="{ visible }"><em class="probe">{{ visible ? "开" : "关" }}</em></template>`,
      },
      attachTo: document.body,
    });
    expect(w.find("em.probe").text()).toBe("关");
    await w.find("button").trigger("click");
    expect(w.find("em.probe").text()).toBe("开");
    w.unmount();
  });

  it("placeholder 透传到输入框", () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "", placeholder: "请输入密码" },
      attachTo: document.body,
    });
    expect(w.find("input").attributes("placeholder")).toBe("请输入密码");
    w.unmount();
  });

  it("id 等 attrs 透传到内部 input", () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "x" },
      attrs: { id: "pwd-input", "aria-describedby": "pwd-msg" },
      attachTo: document.body,
    });
    expect(w.find("input").attributes("id")).toBe("pwd-input");
    expect(w.find("input").attributes("aria-describedby")).toBe("pwd-msg");
    w.unmount();
  });

  it("invalid=true 时根元素带 data-invalid", () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "x", invalid: true },
      attachTo: document.body,
    });
    expect(w.attributes("data-invalid")).toBe("");
    w.unmount();
  });

  it("disabled=true 时输入框与按钮均禁用", () => {
    const w = mount(PasswordInput, {
      props: { modelValue: "x", disabled: true },
      attachTo: document.body,
    });
    expect(w.find("input").attributes("disabled")).toBeDefined();
    expect(w.find("button").attributes("disabled")).toBeDefined();
    w.unmount();
  });
});
