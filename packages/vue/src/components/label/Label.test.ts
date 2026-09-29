import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Label } from "./index";

describe("Label", () => {
  it("渲染 label 元素且 for 透传", () => {
    const w = mount(Label, { attrs: { for: "email" } });
    expect(w.element.tagName).toBe("LABEL");
    expect(w.attributes("for")).toBe("email");
  });

  it("用户 class 合并保留", () => {
    const w = mount(Label, { props: { class: "text-destructive" } });
    expect(w.classes()).toContain("text-destructive");
    expect(w.classes()).toContain("font-medium");
  });
});
