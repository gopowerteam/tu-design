import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Alert } from "./index";

describe("Alert", () => {
  it("默认渲染 status 角色与 default 变体", () => {
    const w = mount(Alert, { props: { title: "提示" } });
    expect(w.attributes("role")).toBe("status");
    expect(w.classes()).toContain("border-border");
    expect(w.text()).toContain("提示");
  });

  it("variant=error 时 role=alert", () => {
    const w = mount(Alert, { props: { title: "出错了", variant: "error" } });
    expect(w.attributes("role")).toBe("alert");
  });

  it.each(["info", "success", "warning", "error"] as const)(
    "variant=%s 应用对应语义色",
    (variant) => {
      const w = mount(Alert, { props: { variant } });
      expect(w.classes().some((c) => c.includes("color-mix"))).toBe(true);
    },
  );

  it("showIcon 默认 true 渲染内置图标，false 时不渲染", async () => {
    const w = mount(Alert, { props: { title: "x" } });
    expect(w.find("svg").exists()).toBe(true);
    const w2 = mount(Alert, { props: { title: "x", showIcon: false } });
    expect(w2.find("svg").exists()).toBe(false);
  });

  it("各变体图标形状互不相同（a11y：不单靠颜色区分）", () => {
    const variants = ["default", "info", "success", "warning", "error"] as const;
    const paths = variants.map((variant) =>
      mount(Alert, { props: { variant } }).find("svg path").attributes("d"),
    );
    expect(new Set(paths).size).toBe(variants.length);
  });

  it("description prop 与 default slot 均可渲染描述", () => {
    const w = mount(Alert, { props: { title: "t", description: "d" } });
    expect(w.text()).toContain("d");
    const w2 = mount(Alert, { props: { title: "t" }, slots: { default: "slot 内容" } });
    expect(w2.text()).toContain("slot 内容");
  });

  it("title slot 覆盖 title prop", () => {
    const w = mount(Alert, { props: { title: "prop" }, slots: { title: "slot 标题" } });
    expect(w.text()).toContain("slot 标题");
    expect(w.text()).not.toContain("prop");
  });

  it("icon slot 覆盖内置图标", () => {
    const w = mount(Alert, {
      props: { title: "x" },
      slots: { icon: '<em class="my-icon">i</em>' },
    });
    expect(w.find(".my-icon").exists()).toBe(true);
  });

  it("closable 点击关闭按钮 emit close 并隐藏", async () => {
    const w = mount(Alert, { props: { title: "x", closable: true } });
    const btn = w.find('button[aria-label="关闭"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger("click");
    expect(w.emitted("close")).toHaveLength(1);
    expect(w.find('[role="status"]').exists()).toBe(false);
  });

  it("非 closable 不渲染关闭按钮", () => {
    const w = mount(Alert, { props: { title: "x" } });
    expect(w.find("button").exists()).toBe(false);
  });

  it("close slot 自定义关闭区", () => {
    const w = mount(Alert, {
      props: { title: "x", closable: true },
      slots: { close: '<button class="custom-close">关</button>' },
    });
    expect(w.find(".custom-close").exists()).toBe(true);
    expect(w.find('button[aria-label="关闭"]').exists()).toBe(false);
  });

  it("用户 class 经 cn 合并", () => {
    const w = mount(Alert, { props: { title: "x", class: "mb-4" } });
    expect(w.classes()).toContain("mb-4");
  });
});
