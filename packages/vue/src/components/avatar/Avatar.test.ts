import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { Avatar as ArkAvatar } from "@ark-ui/vue/avatar";
import { describe, expect, it } from "vite-plus/test";
import { Avatar } from "./index";

describe("Avatar", () => {
  it("根元素带 ark data-scope", () => {
    expect(mount(Avatar).html()).toContain('data-scope="avatar"');
  });

  it("无 src 时渲染 fallback 插槽内容", () => {
    const w = mount(Avatar, { slots: { default: "CT" } });
    expect(w.text()).toContain("CT");
  });

  it("有 src 时渲染 img", () => {
    expect(
      mount(Avatar, { props: { src: "a.png" } })
        .find("img")
        .exists(),
    ).toBe(true);
  });

  it("size 预设映射 tailwind 类", () => {
    expect(mount(Avatar).html()).toContain("size-10");
    expect(mount(Avatar, { props: { size: "lg" } }).html()).toContain("size-12");
    expect(mount(Avatar, { props: { size: "xs" } }).html()).toContain("size-6");
  });

  it("size 为数字时内联宽高且不带预设尺寸类", () => {
    const w = mount(Avatar, { props: { size: 48 } });
    expect(w.attributes("style")).toContain("width: 48px");
    expect(w.attributes("style")).toContain("height: 48px");
    expect(w.html()).not.toContain("size-10");
  });

  it("shape=square 映射 rounded-md", () => {
    expect(mount(Avatar, { props: { shape: "square" } }).html()).toContain("rounded-md");
    expect(mount(Avatar).html()).toContain("rounded-full");
  });

  it("无内容且无图片时渲染默认用户图标", () => {
    expect(mount(Avatar).find("svg").exists()).toBe(true);
  });

  it("color 覆盖 Fallback 背景", () => {
    const w = mount(Avatar, { props: { color: "tomato" } });
    const fb = w.find("[data-part=fallback]");
    expect(fb.attributes("style")).toContain("background: tomato");
  });

  it("placeholder 插槽在加载中显示", () => {
    const w = mount(Avatar, {
      props: { src: "a.png" },
      slots: { placeholder: "加载中", default: "CT" },
    });
    expect(w.text()).toContain("加载中");
  });

  it("status-change 上报 load/error 事件", () => {
    const w = mount(Avatar);
    const root = w.findComponent(ArkAvatar.Root);
    root.vm.$emit("statusChange", { status: "loaded" });
    root.vm.$emit("statusChange", { status: "error" });
    expect(w.emitted("load")).toBeTruthy();
    expect(w.emitted("error")).toBeTruthy();
  });

  it("加载失败时切换到 fallbackSrc", async () => {
    const w = mount(Avatar, { props: { src: "a.png", fallbackSrc: "b.png" } });
    w.findComponent(ArkAvatar.Root).vm.$emit("statusChange", { status: "error" });
    await nextTick();
    expect(w.find("img").attributes("src")).toBe("b.png");
  });
});
