import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./index";

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
      global: {
        components: { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter },
      },
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
    const content = w.find("div.p-6.pt-0");
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
});
