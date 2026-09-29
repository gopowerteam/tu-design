import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Badge } from "./index";

describe("Badge", () => {
  it("默认渲染 span 并应用 default 变体", () => {
    const w = mount(Badge);
    expect(w.element.tagName).toBe("SPAN");
    expect(w.classes()).toContain("bg-primary");
  });

  it("variant=outline 应用 border 且不含 bg-primary", () => {
    const w = mount(Badge, { props: { variant: "outline" } });
    expect(w.classes()).toContain("border");
    expect(w.classes()).not.toContain("bg-primary");
  });

  it("用户 class 覆盖同组默认 class", () => {
    const w = mount(Badge, { props: { class: "bg-red-500" } });
    expect(w.classes()).toContain("bg-red-500");
    expect(w.classes()).not.toContain("bg-primary");
  });
});
