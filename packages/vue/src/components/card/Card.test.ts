import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import {
  Card,
  CardAction,
  CardContent,
  CardCover,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./index";

const components = {
  Card,
  CardAction,
  CardContent,
  CardCover,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

describe("Card", () => {
  it("组合挂载：CardTitle 渲染为 h3 且含 font-semibold", () => {
    const w = mount(Card, {
      slots: {
        default: `
          <CardHeader>
            <CardTitle>标题</CardTitle>
            <CardDescription>描述</CardDescription>
          </CardHeader>
          <CardContent>内容</CardContent>
          <CardFooter>底部</CardFooter>
        `,
      },
      global: { components },
    });
    const title = w.find("h3");
    expect(title.exists()).toBe(true);
    expect(title.classes()).toContain("font-semibold");
    expect(title.text()).toBe("标题");
  });

  it("CardContent 渲染为 div 且内容经插槽透出", () => {
    const w = mount(Card, {
      slots: { default: `<CardContent>内容</CardContent>` },
      global: { components: { Card, CardContent } },
    });
    const content = w.find('[data-slot="card-content"]');
    expect(content.exists()).toBe(true);
    expect(content.text()).toBe("内容");
  });

  it("Card 根元素应用默认卡片样式", () => {
    const w = mount(Card);
    expect(w.classes()).toContain("rounded-xl");
    expect(w.classes()).toContain("bg-card");
    expect(w.classes()).toContain("border-border");
    expect(w.classes()).toContain("shadow-xs");
  });

  it("variants：hoverable / interactive / embedded / bordered=false", () => {
    expect(mount(Card, { props: { hoverable: true } }).classes()).toContain("hover:shadow-md");
    expect(mount(Card, { props: { interactive: true } }).classes()).toContain("cursor-pointer");
    expect(mount(Card, { props: { embedded: true } }).classes()).toContain("bg-muted/30");
    expect(mount(Card, { props: { bordered: false } }).classes()).toContain("border-0");
    expect(mount(Card, { props: { bordered: false } }).classes()).toContain("shadow-none");
  });

  it("size 联动根字级与分区 padding 选择器", () => {
    const w = mount(Card, {
      props: { size: "lg" },
      slots: { default: `<CardHeader /><CardContent />` },
      global: { components },
    });
    expect(w.classes()).toContain("text-base");
    expect(w.classes().some((c) => c.includes("card-header]]:p-8"))).toBe(true);
    const sm = mount(Card, { props: { size: "sm" } });
    expect(sm.classes()).toContain("text-sm");
    expect(sm.classes().some((c) => c.includes("card-header]]:p-4"))).toBe(true);
  });

  it("segmented 为非首分区追加 border-t 与 pt-6 选择器", () => {
    const w = mount(Card, {
      props: { segmented: true },
      slots: {
        default: `
          <CardHeader><CardTitle>标题</CardTitle></CardHeader>
          <CardContent>内容</CardContent>
          <CardFooter>底部</CardFooter>
        `,
      },
      global: { components },
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

  it("CardCover / CardAction 渲染 data-slot", () => {
    const w = mount(Card, {
      slots: {
        default: `
          <CardCover><img src="x.png" alt="cover" /></CardCover>
          <CardHeader>
            <CardTitle>标题</CardTitle>
            <CardAction><button>操作</button></CardAction>
          </CardHeader>
        `,
      },
      global: { components },
    });
    expect(w.find('[data-slot="card-cover"]').exists()).toBe(true);
    const action = w.find('[data-slot="card-action"]');
    expect(action.exists()).toBe(true);
    expect(action.classes()).toContain("justify-self-end");
  });
});
