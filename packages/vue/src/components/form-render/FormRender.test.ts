import { flushPromises, mount } from "@vue/test-utils";
import * as v from "valibot";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineForm } from "./define-form";
import FormRender from "./FormRender.vue";
import type { FormRenderDefinition, FormRenderItem } from "./types";

interface SearchParams {
  keyword: string;
  status: string | null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

function baseItems(): FormRenderItem<SearchParams>[] {
  return [
    { key: "keyword", title: "关键词", default: "" },
    { key: "status", title: "状态", default: "" },
  ];
}

/** Host 在 setup 内 defineForm（TanStack 约束）并渲染 FormRender */
function makeFormRender(
  props: Record<string, unknown> = {},
  config: { items?: FormRenderItem<SearchParams>[]; schema?: unknown } = {},
) {
  const box: { def?: FormRenderDefinition<SearchParams> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineForm<SearchParams>({
        items: config.items ?? baseItems(),
        ...(config.schema ? { schema: config.schema } : {}),
        onSubmit: () => {},
      });
      return () => h(FormRender, { definition: box.def, ...props });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def! };
}

function labelTexts(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll("label").map((l) => l.text());
}

describe("FormRender 渲染", () => {
  it("definition 单 prop 渲染全部字段，label 顺序 = items 顺序", () => {
    const { wrapper } = makeFormRender();
    expect(labelTexts(wrapper)).toEqual(["关键词", "状态"]);
  });

  it("definition 与 form + items 拆分 props 等价", () => {
    const { def } = makeFormRender();
    const d = def()!;
    const split = mount(FormRender, {
      props: { form: d.form, items: d.items },
      attachTo: document.body,
    });
    expect(labelTexts(split)).toEqual(["关键词", "状态"]);
    split.unmount();
  });

  it("无 render 缺省为 input", () => {
    const { wrapper } = makeFormRender();
    expect(wrapper.findAll("input").length).toBe(2);
  });

  it("visible: false 不渲染字段", () => {
    const { wrapper } = makeFormRender(
      {},
      {
        items: [
          { key: "keyword", title: "关键词", default: "" },
          { key: "status", title: "状态", default: "", visible: false },
        ],
      },
    );
    expect(labelTexts(wrapper)).toEqual(["关键词"]);
  });

  it("visible 函数随响应式 values 联动（S1 回归）", async () => {
    const { wrapper } = makeFormRender(
      {},
      {
        items: [
          { key: "keyword", title: "关键词", default: "" },
          { key: "status", title: "状态", default: "", visible: (values) => values.keyword !== "" },
        ],
      },
    );
    // keyword 为空 → status 隐藏
    expect(labelTexts(wrapper)).toEqual(["关键词"]);
    // 输入 keyword → status 出现
    await wrapper.find("input").setValue("x");
    await flushPromises();
    expect(labelTexts(wrapper)).toEqual(["关键词", "状态"]);
    // 清空 keyword → status 再次隐藏
    await wrapper.find("input").setValue("");
    await flushPromises();
    expect(labelTexts(wrapper)).toEqual(["关键词"]);
  });

  it("span: 'full' → gridColumn 1/-1；数字 → span n", () => {
    const { wrapper } = makeFormRender(
      {},
      {
        items: [
          { key: "keyword", title: "关键词", default: "", span: "full" },
          { key: "status", title: "状态", default: "", span: 2 },
        ],
      },
    );
    const cells = wrapper.findAll(".grid > div");
    expect(cells[0].attributes("style")).toContain("grid-column: 1 / -1");
    expect(cells[1].attributes("style")).toContain("span 2");
  });

  it("description 渲染为提示文本", () => {
    const { wrapper } = makeFormRender(
      {},
      { items: [{ key: "keyword", title: "关键词", default: "", description: "按回车搜索" }] },
    );
    expect(wrapper.text()).toContain("按回车搜索");
  });
});

describe("FormRender actions 与事件", () => {
  it("默认（无 flags）不渲染 actions 区按钮", () => {
    const { wrapper } = makeFormRender();
    expect(wrapper.findAll("button").length).toBe(0);
  });

  it("searchable → 搜索 + 重置；submitable → 提交 + 取消", () => {
    const s = makeFormRender({ searchable: true });
    const texts = s.wrapper.findAll("button").map((b) => b.text());
    expect(texts).toEqual(["搜索", "重置"]);
    s.wrapper.unmount();

    const u = makeFormRender({ submitable: true });
    expect(u.wrapper.findAll("button").map((b) => b.text())).toEqual(["提交", "取消"]);
    u.wrapper.unmount();
  });

  it("searchable/resetable 缺省跟随（resetable 缺省 = searchable）", () => {
    const s = makeFormRender({ searchable: true, resetable: false });
    expect(s.wrapper.findAll("button").map((b) => b.text())).toEqual(["搜索"]);
    s.wrapper.unmount();
  });

  it("搜索：handleSubmit 成功后 emit search", async () => {
    const { wrapper } = makeFormRender({ searchable: true });
    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();
    expect(wrapper.getComponent(FormRender).emitted("search")).toHaveLength(1);
  });

  it("校验失败时不 emit search（I4）", async () => {
    const { wrapper } = makeFormRender(
      { searchable: true },
      {
        schema: v.object({
          keyword: v.pipe(v.string(), v.minLength(2, "至少 2 个字符")),
          status: v.nullable(v.string()),
        }),
      },
    );
    await wrapper.find("input").setValue("a");
    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();
    expect(wrapper.getComponent(FormRender).emitted("search")).toBeUndefined();
    // 修正后放行
    await wrapper.find("input").setValue("ab");
    await wrapper.findAll("button")[0].trigger("click");
    await flushPromises();
    expect(wrapper.getComponent(FormRender).emitted("search")).toHaveLength(1);
  });

  it("重置：值回 items.default 并 emit reset", async () => {
    const { wrapper } = makeFormRender({ searchable: true });
    await wrapper.find("input").setValue("changed");
    await wrapper.findAll("button")[1].trigger("click");
    await flushPromises();
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("");
    expect(wrapper.getComponent(FormRender).emitted("reset")).toHaveLength(1);
  });
});

describe("FormRender 归一化与防御", () => {
  it("缺 definition 且缺 form/items → DEV warn", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(FormRender, {
      props: { items: [{ key: "a", title: "A" }] } as never,
      attachTo: document.body,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FormRender"));
    w.unmount();
  });

  it("expose 暴露 form 与 resetToDefaults", async () => {
    const { wrapper } = makeFormRender();
    const fr = wrapper.getComponent(FormRender);
    expect(fr.vm.form).toBeTruthy();
    (fr.vm as any).resetToDefaults();
    await flushPromises();
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe("");
  });
});
