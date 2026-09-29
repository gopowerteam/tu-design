import { mount } from "@vue/test-utils";
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
});
