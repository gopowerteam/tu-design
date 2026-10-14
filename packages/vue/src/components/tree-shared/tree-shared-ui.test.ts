import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vite-plus/test";
import ValueTags from "./ValueTags.vue";

const VALUES = [
  { key: "a", label: "甲" },
  { key: "b", label: "乙" },
  { key: "c", label: "丙" },
];

describe("ValueTags", () => {
  it("maxTagCount 折叠超出项为 +N", () => {
    const w = mount(ValueTags, { props: { values: VALUES, maxTagCount: 2 } });
    const tags = w.findAll('[data-part="tag"]');
    expect(tags.length).toBe(2);
    expect(tags[0]!.attributes("data-key")).toBe("a");
    expect(w.find('[data-part="tag-overflow"]').text()).toBe("+1");
  });

  it("无 maxTagCount 时全部展示且无折叠符", () => {
    const w = mount(ValueTags, { props: { values: VALUES } });
    expect(w.findAll('[data-part="tag"]').length).toBe(3);
    expect(w.find('[data-part="tag-overflow"]').exists()).toBe(false);
  });

  it("tag-remove 事件携带对应 key", async () => {
    const w = mount(ValueTags, { props: { values: VALUES } });
    await w.find('[data-key="b"] [data-part="tag-remove"]').trigger("click");
    expect(w.emitted("remove")![0]).toEqual(["b"]);
  });

  it("clearable 渲染清空按钮并发出 clear", async () => {
    const w = mount(ValueTags, { props: { values: VALUES, clearable: true } });
    expect(w.find('[data-part="clear"]').exists()).toBe(true);
    await w.find('[data-part="clear"]').trigger("click");
    expect(w.emitted("clear")).toHaveLength(1);
  });

  it("disabled 时不渲染删除与清空按钮", () => {
    const w = mount(ValueTags, { props: { values: VALUES, clearable: true, disabled: true } });
    expect(w.find('[data-part="tag-remove"]').exists()).toBe(false);
    expect(w.find('[data-part="clear"]').exists()).toBe(false);
  });
});
