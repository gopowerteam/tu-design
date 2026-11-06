import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Input } from "./index";

/** setValue 在直挂 modelValue prop 时于本环境不可靠（事件未达元素），手动赋值+派发保证确定性 */
function dispatchInput(w: { find: (s: string) => { element: HTMLInputElement } }, value: string) {
  const el = w.find("input").element;
  el.value = value;
  el.dispatchEvent(new Event("input"));
}

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

  it("number 绑定跟随归一：回写 string 转 number", async () => {
    const w = mount(Input, {
      props: {
        modelValue: 5,
        "onUpdate:modelValue": (v: string | number) => w.setProps({ modelValue: v }),
      },
    });
    dispatchInput(w, "42");
    await w.vm.$nextTick();
    expect(w.emitted("update:modelValue")![0]).toEqual([42]);
    expect(w.props("modelValue")).toBe(42);
  });

  it("number 绑定下非数字输入原样透传（looseToNumber NaN 语义）", () => {
    const w = mount(Input, { props: { modelValue: 5 } });
    dispatchInput(w, "abc");
    expect(w.emitted("update:modelValue")![0]).toEqual(["abc"]);
  });

  it("number 绑定下同值不重复 emit（string 已归一判等）", () => {
    const w = mount(Input, { props: { modelValue: 5 } });
    dispatchInput(w, "5");
    expect(w.emitted("update:modelValue")).toBeUndefined();
  });

  it("文本绑定不归一：前导零/非数字串保持 string", () => {
    const w = mount(Input, { props: { modelValue: "hi" } });
    dispatchInput(w, "0571");
    expect(w.emitted("update:modelValue")![0]).toEqual(["0571"]);
  });
});
