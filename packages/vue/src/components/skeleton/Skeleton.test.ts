import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Skeleton } from "./index";

describe("Skeleton", () => {
  it("渲染 div 含 animate-pulse 且 aria-hidden", () => {
    const w = mount(Skeleton);
    expect(w.element.tagName).toBe("DIV");
    expect(w.classes()).toContain("animate-pulse");
    expect(w.attributes("aria-hidden")).toBe("true");
  });

  it("用户 class 合并保留", () => {
    const w = mount(Skeleton, { props: { class: "h-4 w-32" } });
    expect(w.classes()).toContain("h-4");
    expect(w.classes()).toContain("animate-pulse");
  });
});
