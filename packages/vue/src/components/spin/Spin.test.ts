import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Spin } from "./index";

describe("Spin", () => {
  it("独立态：spinning 时渲染 role=status + aria-busy + 默认 aria-label", () => {
    const w = mount(Spin);
    const status = w.find('[role="status"]');
    expect(status.exists()).toBe(true);
    expect(status.attributes("aria-busy")).toBe("true");
    expect(status.attributes("aria-label")).toBe("加载中");
    expect(status.find("svg").classes()).toContain("animate-spin");
    expect(w.attributes("aria-busy")).toBe("true");
  });

  it("独立态：spinning=false 时不渲染任何内容", () => {
    const w = mount(Spin, { props: { spinning: false } });
    expect(w.find('[role="status"]').exists()).toBe(false);
    expect(w.find("svg").exists()).toBe(false);
  });

  it("size 变体映射 svg 尺寸 class", () => {
    const sm = mount(Spin, { props: { size: "sm" } });
    expect(sm.find("svg").classes()).toContain("size-4");
    const def = mount(Spin);
    expect(def.find("svg").classes()).toContain("size-6");
    const lg = mount(Spin, { props: { size: "lg" } });
    expect(lg.find("svg").classes()).toContain("size-8");
  });

  it("自定义 label 透传到 aria-label", () => {
    const w = mount(Spin, { props: { label: "提交中" } });
    expect(w.find('[role="status"]').attributes("aria-label")).toBe("提交中");
  });

  it("包裹态：默认 slot 有内容时内容常驻 + spinning 渲染半透明遮罩（role=status）", () => {
    const w = mount(Spin, { slots: { default: "<p>内容区</p>" } });
    expect(w.text()).toContain("内容区");
    const overlay = w.find('[role="status"]');
    expect(overlay.exists()).toBe(true);
    expect(overlay.classes()).toContain("absolute");
    expect(overlay.classes()).toContain("bg-background/60");
    expect(overlay.find("svg").classes()).toContain("animate-spin");
    expect(w.attributes("aria-busy")).toBe("true");
  });

  it("包裹态：spinning=false 隐藏遮罩、内容保留、aria-busy 同步为 false", () => {
    const w = mount(Spin, {
      props: { spinning: false },
      slots: { default: "<p>内容区</p>" },
    });
    expect(w.text()).toContain("内容区");
    expect(w.find('[role="status"]').exists()).toBe(false);
    expect(w.attributes("aria-busy")).toBe("false");
  });

  it("用户 class 合并保留", () => {
    const w = mount(Spin, { props: { class: "justify-center" } });
    expect(w.classes()).toContain("justify-center");
  });
});
