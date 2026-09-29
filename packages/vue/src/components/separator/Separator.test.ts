import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import { Separator } from "./index";

describe("Separator", () => {
  it("默认水平：data-orientation=horizontal 且含 h-px", () => {
    const w = mount(Separator);
    expect(w.element.tagName).toBe("DIV");
    expect(w.attributes("data-orientation")).toBe("horizontal");
    expect(w.classes()).toContain("h-px");
  });

  it("orientation=vertical 应用 w-px", () => {
    const w = mount(Separator, { props: { orientation: "vertical" } });
    expect(w.attributes("data-orientation")).toBe("vertical");
    expect(w.classes()).toContain("w-px");
  });
});
