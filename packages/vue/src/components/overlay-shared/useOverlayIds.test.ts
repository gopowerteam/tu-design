import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vite-plus/test";
import { useOverlayIds } from "./useOverlayIds";

// useId 需组件 setup 上下文：经宿主组件挂载暴露返回值断言
function mountIds(
  attrs: Record<string, unknown>,
  options: { primary: string; parts: readonly string[] },
) {
  const captured: { value?: ReturnType<typeof useOverlayIds> } = {};
  const Host = defineComponent({
    inheritAttrs: false,
    setup(_, { expose }) {
      captured.value = useOverlayIds(attrs, options);
      expose({});
      return () => "";
    },
  });
  mount(Host);
  const value = captured.value;
  if (!value) throw new Error("useOverlayIds 未执行");
  return { ids: value.ids, resolveId: value.resolveId };
}

describe("useOverlayIds", () => {
  it("parts 全量派生且 primary 用纯 stem，全值无冒号", () => {
    const { ids } = mountIds(
      {},
      { primary: "content", parts: ["content", "title", "description", "arrow"] },
    );
    expect(Object.keys(ids.value).sort()).toEqual(["arrow", "content", "description", "title"]);
    expect(ids.value.content).toMatch(/^v-\d+$/);
    const contentId = ids.value.content as string;
    expect(ids.value.title).toBe(`${contentId}-title`);
    for (const v of Object.values(ids.value)) {
      if (typeof v === "string") expect(v).not.toContain(":");
    }
  });

  it("user 显式 ids 以其为准（含函数型原样保留）", () => {
    const itemFn = (value: string) => `custom-${value}`;
    const { ids } = mountIds(
      { ids: { title: "my-title", item: itemFn } },
      { primary: "content", parts: ["content", "title"] },
    );
    expect(ids.value.title).toBe("my-title");
    expect(ids.value.item).toBe(itemFn);
    expect(ids.value.content).toMatch(/^v-\d+$/);
  });

  it("resolveId：user 覆盖优先，函数型 user 回退默认，无冒号", () => {
    const { resolveId } = mountIds(
      { ids: { title: "my-title", item: (v: string) => `f-${v}` } },
      { primary: "content", parts: ["content", "title", "item"] },
    );
    expect(resolveId("title")).toBe("my-title");
    expect(resolveId("item")).toMatch(/^v-\d+-item$/); // 函数型 user 不参与 resolveId
    expect(resolveId("content")).toMatch(/^v-\d+$/);
    expect(resolveId("content")).not.toContain(":");
  });
});
