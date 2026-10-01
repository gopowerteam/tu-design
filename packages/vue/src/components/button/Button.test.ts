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

  it("icon 插槽渲染在默认内容之前", () => {
    const w = mount(Button, {
      slots: { icon: '<svg data-test="icon"/>', default: "文字" },
    });
    const svg = w.find('svg[data-test="icon"]');
    expect(svg.exists()).toBe(true);
    const html = w.element.innerHTML;
    expect(html.indexOf("<svg")).toBeLessThan(html.indexOf("文字"));
  });
});

describe("Button asChild", () => {
  const child = '<a class="font-bold" href="/docs">文档</a>';

  it("渲染子元素并携带变体类与子元素自身类", () => {
    const w = mount(Button, { props: { asChild: true }, slots: { default: child } });
    expect(w.element.tagName).toBe("A");
    expect(w.classes()).toContain("bg-primary");
    expect(w.classes()).toContain("font-bold");
    expect(w.attributes("href")).toBe("/docs");
  });

  it("as 属性被忽略", () => {
    const w = mount(Button, {
      props: { asChild: true, as: "span" },
      slots: { default: child },
    });
    expect(w.element.tagName).toBe("A");
  });

  it("子元素 class 与变体类经 cn 冲突合并（子元素优先）", () => {
    const w = mount(Button, {
      props: { asChild: true, class: "px-10" },
      slots: { default: '<a class="bg-red-500 px-20">x</a>' },
    });
    expect(w.classes()).toContain("bg-red-500");
    expect(w.classes()).toContain("px-20");
    expect(w.classes()).not.toContain("bg-primary");
    expect(w.classes()).not.toContain("px-4");
  });

  it("透传 attrs 落到子元素", () => {
    const w = mount(Button, {
      props: { asChild: true },
      attrs: { type: "submit" },
      slots: { default: child },
    });
    expect(w.attributes("type")).toBe("submit");
  });
});
