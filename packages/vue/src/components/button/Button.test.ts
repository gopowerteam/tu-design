import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Button } from "./index";

describe("Button", () => {
  it("默认渲染 button 元素并应用 default 变体", () => {
    const w = mount(Button);
    expect(w.element.tagName).toBe("BUTTON");
    expect(w.classes()).toContain("bg-primary");
  });

  it("as 属性切换渲染标签", () => {
    expect(mount(Button, { props: { as: "a" } }).element.tagName).toBe("A");
  });

  it("size=lg 应用 h-10", () => {
    expect(mount(Button, { props: { size: "lg" } }).classes()).toContain("h-10");
  });

  it("用户 class 覆盖同组默认 class", () => {
    const w = mount(Button, { props: { class: "bg-red-500" } });
    expect(w.classes()).toContain("bg-red-500");
    expect(w.classes()).not.toContain("bg-primary");
  });
});
