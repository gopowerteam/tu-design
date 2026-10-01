import { mount } from "@vue/test-utils";
import { h } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import { Slot } from "./index";

const child = '<a class="inner" href="/docs">文档</a>';

describe("Slot", () => {
  it("渲染子元素本身并将 attrs 合并其上", () => {
    const w = mount(Slot, { attrs: { "data-kind": "button" }, slots: { default: child } });
    expect(w.element.tagName).toBe("A");
    expect(w.attributes("data-kind")).toBe("button");
    expect(w.attributes("href")).toBe("/docs");
    expect(w.classes()).toContain("inner");
  });

  it("class 经 cn 冲突合并（子元素优先）", () => {
    const w = mount(Slot, {
      attrs: { class: "px-4 py-2" },
      slots: { default: '<a class="px-20">x</a>' },
    });
    expect(w.classes()).toContain("px-20");
    expect(w.classes()).not.toContain("px-4");
  });

  it("子元素自身 props 优先于注入的同名属性", () => {
    const w = mount(Slot, {
      attrs: { type: "button" },
      slots: { default: '<button type="submit">go</button>' },
    });
    expect(w.attributes("type")).toBe("submit");
  });

  it("注入与子元素的事件处理器都会触发", async () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const w = mount(Slot, {
      attrs: { onClick: outer },
      slots: { default: () => h("button", { onClick: inner }, "x") },
    });
    await w.find("button").trigger("click");
    expect(outer).toHaveBeenCalledOnce();
    expect(inner).toHaveBeenCalledOnce();
  });

  it("多个子节点：第一个承接合并，其余原样渲染", () => {
    const w = mount(Slot, {
      attrs: { "data-kind": "x" },
      slots: { default: '<a id="one">1</a><a id="two">2</a>' },
    });
    expect(w.find("#one").attributes("data-kind")).toBe("x");
    expect(w.find("#two").attributes("data-kind")).toBeUndefined();
  });

  it("子节点为纯文本时原样渲染", () => {
    const w = mount(Slot, { attrs: { class: "px-4" }, slots: { default: "纯文本" } });
    expect(w.text()).toBe("纯文本");
  });

  it("空默认插槽抛出可读错误", () => {
    expect(() => mount(Slot)).toThrow(/默认插槽/);
  });
});
