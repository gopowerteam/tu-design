import { Fragment, h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Avatar } from "../avatar";
import { AvatarGroup } from "./index";

describe("AvatarGroup", () => {
  it("超出 max 时渲染 +N 尾巴并真实折叠溢出", () => {
    const w = mount(AvatarGroup, {
      props: { max: 2 },
      slots: { default: () => [h(Avatar), h(Avatar), h(Avatar)] },
    });
    expect(w.text()).toContain("+1");
    // 溢出子节点不渲染（切片而非样式隐藏）：2 个可见子 Avatar + 1 个尾巴
    expect(w.findAllComponents(Avatar).length).toBe(3);
  });

  it("v-for 生成的 Fragment 插槽同样折叠（真实模板场景）", () => {
    const w = mount(AvatarGroup, {
      props: { max: 2 },
      slots: { default: () => [h(Fragment, [h(Avatar), h(Avatar), h(Avatar)])] },
    });
    expect(w.text()).toContain("+1");
    expect(w.findAllComponents(Avatar).length).toBe(3);
  });

  it("rest 插槽可自定义溢出内容", () => {
    const w = mount(AvatarGroup, {
      props: { max: 1 },
      slots: {
        default: () => [h(Avatar), h(Avatar)],
        rest: ({ rest }: { rest: number }) => `et +${rest}`,
      },
    });
    expect(w.text()).toContain("et +1");
  });

  it("vertical 切换纵向排列", () => {
    const w = mount(AvatarGroup, {
      props: { vertical: true },
      slots: { default: () => [h(Avatar)] },
    });
    expect(w.html()).toContain("flex-col");
  });

  it("expandOnHover 悬停展开", async () => {
    const w = mount(AvatarGroup, {
      props: { max: 1, expandOnHover: true },
      slots: { default: () => [h(Avatar), h(Avatar)] },
    });
    // 折叠态：1 个可见子 Avatar + 尾巴
    expect(w.findAllComponents(Avatar).length).toBe(2);
    expect(w.text()).toContain("+1");
    await w.trigger("mouseenter");
    // 展开态：2 个子 Avatar 全部渲染，尾巴消失
    expect(w.text()).not.toContain("+1");
    expect(w.findAllComponents(Avatar).length).toBe(2);
  });

  it("size 下发给子 Avatar", () => {
    const w = mount(AvatarGroup, {
      props: { size: "sm" },
      slots: { default: () => [h(Avatar)] },
    });
    expect(w.html()).toContain("size-8");
  });

  it("bordered 为子头像加描边", () => {
    const w = mount(AvatarGroup, {
      props: { bordered: true },
      slots: { default: () => [h(Avatar)] },
    });
    expect(w.html()).toContain("ring-2");
  });
});
