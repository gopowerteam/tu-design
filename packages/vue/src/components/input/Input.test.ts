import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Input } from "./index";

describe("Input", () => {
  it("渲染 input 元素并支持 v-model", async () => {
    const w = mount(Input);
    expect(w.element.tagName).toBe("INPUT");
    await w.setValue("hi");
    expect(w.emitted("update:modelValue")![0]).toEqual(["hi"]);
  });

  it("attrs 自然透传（placeholder/type/disabled）", () => {
    const w = mount(Input, {
      attrs: { placeholder: "x", type: "email", disabled: true },
    });
    expect(w.attributes("placeholder")).toBe("x");
    expect(w.attributes("type")).toBe("email");
    expect(w.attributes("disabled")).toBeDefined();
  });

  it("用户 class 合并保留", () => {
    const w = mount(Input, { props: { class: "border-red-500" } });
    expect(w.classes()).toContain("border-red-500");
    expect(w.classes()).toContain("h-9");
  });

  it("invalid 时输出 aria-invalid 并带 destructive 校验样式", () => {
    const w = mount(Input, { props: { invalid: true } });
    expect(w.attributes("aria-invalid")).toBe("true");
    expect(w.classes()).toContain("aria-invalid:border-destructive");
  });

  it("不传 invalid 时无 aria-invalid 属性", () => {
    const w = mount(Input);
    expect(w.attributes("aria-invalid")).toBeUndefined();
  });
});
