import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Empty } from "./index";

describe("Empty", () => {
  it("默认渲染 role=status 与默认文案", () => {
    const w = mount(Empty);
    expect(w.attributes("role")).toBe("status");
    expect(w.text()).toContain("暂无数据");
    expect(w.find("svg").exists()).toBe(true);
  });

  it("description prop 覆盖文案", () => {
    const w = mount(Empty, { props: { description: "没有搜索结果" } });
    expect(w.text()).toContain("没有搜索结果");
    expect(w.text()).not.toContain("暂无数据");
  });

  it("icon 插槽覆盖内置插画", () => {
    const w = mount(Empty, {
      slots: { icon: '<svg data-test="custom" />' },
    });
    expect(w.find('[data-test="custom"]').exists()).toBe(true);
    expect(w.find("svg[data-test]").exists()).toBe(true);
  });

  it("default 插槽渲染底部内容区", () => {
    const w = mount(Empty, {
      slots: { default: '<button data-test="action">重试</button>' },
    });
    expect(w.find('[data-test="action"]').exists()).toBe(true);
  });

  it("无 default 插槽时不渲染底部内容区", () => {
    const w = mount(Empty);
    expect(w.findAll("div > div").length).toBeGreaterThan(0);
    // 底部内容区容器仅在插槽存在时渲染
    const html = w.html();
    expect(html).not.toContain("mt-2");
  });

  it("用户 class 合并保留", () => {
    const w = mount(Empty, { props: { class: "py-4" } });
    expect(w.classes()).toContain("py-4");
    expect(w.classes()).toContain("flex-col");
  });
});
