import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Card } from "./index";

describe("Card", () => {
  it("title / description 渲染进头部且样式类原样搬运", () => {
    const w = mount(Card, {
      props: { title: "标题", description: "描述" },
    });
    const header = w.find('[data-slot="card-header"]');
    expect(header.exists()).toBe(true);
    expect(header.classes()).toContain("p-6");

    const title = w.find('[data-slot="card-title"]');
    expect(title.element.tagName).toBe("H3");
    expect(title.classes()).toContain("font-semibold");
    expect(title.text()).toBe("标题");

    const description = w.find('[data-slot="card-description"]');
    expect(description.element.tagName).toBe("P");
    expect(description.classes()).toContain("text-muted-foreground");
    expect(description.text()).toBe("描述");
  });

  it("默认插槽渲染为内容区（card-content）", () => {
    const w = mount(Card, { slots: { default: "内容" } });
    const content = w.find('[data-slot="card-content"]');
    expect(content.exists()).toBe(true);
    expect(content.classes()).toContain("p-6");
    expect(content.classes()).toContain("pt-0");
    expect(content.text()).toBe("内容");
  });

  it("#cover / #action / #footer 渲染对应分区", () => {
    const w = mount(Card, {
      props: { title: "标题" },
      slots: {
        cover: "<img src='x.png' alt='cover' />",
        action: "<button>操作</button>",
        footer: "底部",
        default: "内容",
      },
    });
    const cover = w.find('[data-slot="card-cover"]');
    expect(cover.exists()).toBe(true);
    expect(cover.classes()).toContain("rounded-t-[inherit]");

    const action = w.find('[data-slot="card-action"]');
    expect(action.exists()).toBe(true);
    expect(action.classes()).toContain("justify-self-end");
    expect(action.text()).toBe("操作");

    const footer = w.find('[data-slot="card-footer"]');
    expect(footer.exists()).toBe(true);
    expect(footer.classes()).toContain("p-6");
    expect(footer.text()).toBe("底部");
  });

  it("#header 逃生口替代 title/description 头部渲染，#action 仍叠加", () => {
    const w = mount(Card, {
      props: { title: "标题", description: "描述" },
      slots: {
        header: "<h2>自定义头部</h2>",
        action: "<button>操作</button>",
      },
    });
    const header = w.find('[data-slot="card-header"]');
    expect(header.classes()).toContain("p-6");
    expect(header.text()).toContain("自定义头部");
    expect(w.find('[data-slot="card-title"]').exists()).toBe(false);
    expect(w.find('[data-slot="card-description"]').exists()).toBe(false);
    // #action 独立于 #header，仍在头部内渲染
    expect(w.find('[data-slot="card-action"]').exists()).toBe(true);
  });

  it("#title / #description 插槽可覆盖对应文案渲染", () => {
    const w = mount(Card, {
      slots: {
        title: "<em>富文本标题</em>",
        description: "插槽描述",
      },
    });
    expect(w.find('[data-slot="card-title"]').text()).toBe("富文本标题");
    expect(w.find('[data-slot="card-description"]').text()).toBe("插槽描述");
  });

  it("无头部时不渲染 header DOM", () => {
    const w = mount(Card, { slots: { default: "内容" } });
    expect(w.find('[data-slot="card-header"]').exists()).toBe(false);
  });

  it("根元素应用默认卡片样式，class 经 cn 合并", () => {
    const w = mount(Card, { props: { class: "my-4" } });
    expect(w.classes()).toContain("rounded-xl");
    expect(w.classes()).toContain("bg-card");
    expect(w.classes()).toContain("border-border");
    expect(w.classes()).toContain("shadow-xs");
    expect(w.classes()).toContain("my-4");
  });

  it("variants：hoverable / interactive / embedded / bordered=false", () => {
    expect(mount(Card, { props: { hoverable: true } }).classes()).toContain("hover:shadow-md");
    expect(mount(Card, { props: { interactive: true } }).classes()).toContain("cursor-pointer");
    expect(mount(Card, { props: { embedded: true } }).classes()).toContain("bg-muted/30");
    expect(mount(Card, { props: { bordered: false } }).classes()).toContain("border-0");
    expect(mount(Card, { props: { bordered: false } }).classes()).toContain("shadow-none");
  });

  it("size 联动根字级与分区 padding 选择器", () => {
    const lg = mount(Card, {
      props: { size: "lg", title: "标题" },
      slots: { default: "内容" },
    });
    expect(lg.classes()).toContain("text-base");
    expect(lg.classes().some((c) => c.includes("card-header]]:p-8"))).toBe(true);
    const sm = mount(Card, { props: { size: "sm", title: "标题" } });
    expect(sm.classes()).toContain("text-sm");
    expect(sm.classes().some((c) => c.includes("card-header]]:p-4"))).toBe(true);
  });

  it("segmented 为非首分区追加 border-t 与 pt-6 选择器", () => {
    const w = mount(Card, {
      props: { segmented: true, title: "标题" },
      slots: { default: "内容", footer: "底部" },
    });
    const classes = w.classes();
    expect(classes.some((c) => c.includes(":not(:first-child)") && c.includes(":border-t"))).toBe(
      true,
    );
    expect(classes.some((c) => c.includes("card-content]]:pt-6"))).toBe(true);
    expect(classes.some((c) => c.includes("card-footer]]:pt-6"))).toBe(true);
  });

  it("closable 渲染关闭按钮并触发 close 事件", async () => {
    const w = mount(Card, { props: { closable: true } });
    const btn = w.find('button[aria-label="关闭"]');
    expect(btn.exists()).toBe(true);
    await btn.trigger("click");
    expect(w.emitted("close")).toHaveLength(1);
  });
});
