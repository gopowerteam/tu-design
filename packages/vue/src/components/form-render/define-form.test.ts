import { mount } from "@vue/test-utils";
import * as v from "valibot";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import { defineForm } from "./define-form";
import { useFormRender } from "./useFormRender";
import type { FormRenderDefinition, FormRenderItem } from "./types";

interface SearchParams {
  keyword: string;
  status: string | null;
  range: [string, string] | null;
}

/** defineForm/useFormRender 须在组件 setup 内调用（useForm 内部 onMounted mount），Host 模式承载 */
function makeHost(
  config: Parameters<typeof defineForm<SearchParams>>[0],
  create: typeof defineForm = defineForm,
): { def: () => FormRenderDefinition<SearchParams> | undefined } {
  const box: { def?: FormRenderDefinition<SearchParams> } = {};
  const Host = defineComponent({
    setup() {
      box.def = create<SearchParams>(config);
      // 渲染 form.Field 注册字段（真实 UI 中 FormRenderField 必然注册）：
      // handleSubmit 会先 validateAllFields，未注册字段的残留错误无人清除会永久短路
      const form = box.def.form;
      const fields = () =>
        config.items.map((item) =>
          h(form.Field as never, { name: String(item.key) } as never, {
            default: () => h("span"),
          }),
        );
      return () => h("div", fields());
    },
  });
  mount(Host, { attachTo: document.body });
  return { def: () => box.def };
}

describe("useFormRender", () => {
  it("defaultValues 从 items.default 派生：值 / 工厂 / 缺省 null", () => {
    const { def } = makeHost({
      items: [
        { key: "keyword", title: "关键词", default: "hello" },
        { key: "status", title: "状态", default: () => "open" },
        { key: "range", title: "日期" },
      ],
    });
    expect(def()!.form.state.values).toEqual({
      keyword: "hello",
      status: "open",
      range: null,
    });
  });

  it("resetToDefaults 将全部字段恢复为派生默认值", async () => {
    const { def } = makeHost({
      items: [
        { key: "keyword", title: "关键词", default: "hi" },
        { key: "status", title: "状态" },
      ],
    });
    const d = def()!;
    d.form.setFieldValue("keyword", "changed");
    d.resetToDefaults();
    expect(d.form.state.values).toEqual({ keyword: "hi", status: null });
  });

  it("handleSubmit 校验通过后调用 onSubmit 且 value 为全量表单值", async () => {
    const onSubmit = vi.fn();
    const { def } = makeHost({
      items: [{ key: "keyword", title: "关键词" }],
      onSubmit: ({ value }) => onSubmit(value),
    });
    def()!.form.setFieldValue("keyword", "abc");
    await def()!.form.handleSubmit();
    expect(onSubmit).toHaveBeenCalledWith({ keyword: "abc" });
  });

  it("schema 校验失败时拦截 onSubmit", async () => {
    const onSubmit = vi.fn();
    const { def } = makeHost({
      items: [
        { key: "keyword", title: "关键词" },
        { key: "status", title: "状态" },
        { key: "range", title: "日期" },
      ],
      schema: v.object({
        keyword: v.pipe(v.string(), v.minLength(2, "至少 2 个字符")),
        status: v.nullable(v.string()),
        range: v.nullable(v.tuple([v.string(), v.string()])),
      }),
      onSubmit: ({ value }) => onSubmit(value),
    });
    def()!.form.setFieldValue("keyword", "a");
    await def()!.form.handleSubmit();
    expect(onSubmit).not.toHaveBeenCalled();
    // 修复后放行（提交失败后 canSubmit 门控不得静默拦截后续提交）
    def()!.form.setFieldValue("keyword", "ab");
    await def()!.form.handleSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("defineForm", () => {
  it("聚合 useFormRender：返回 items/form/resetToDefaults 且行为一致", async () => {
    const onSubmit = vi.fn();
    const { def } = makeHost(
      {
        items: [{ key: "keyword", title: "关键词", default: "init" }],
        onSubmit: ({ value }) => onSubmit(value),
      },
      defineForm,
    );
    const d = def()!;
    expect(d.items).toHaveLength(1);
    expect(d.form.state.values.keyword).toBe("init");
    await d.form.handleSubmit();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    d.form.setFieldValue("keyword", "next");
    d.resetToDefaults();
    expect(d.form.state.values.keyword).toBe("init");
  });

  it("key 拼错编译报错（严格 keyof T）", () => {
    const items: FormRenderItem<SearchParams>[] = [
      { key: "keyword", title: "关键词" },
      // @ts-expect-error 拼错的 key 必须编译失败
      { key: "kyword", title: "拼错" },
    ];
    const { def } = makeHost({ items });
    expect(Object.keys(def()!.form.state.values)).toContain("keyword");
  });
});
