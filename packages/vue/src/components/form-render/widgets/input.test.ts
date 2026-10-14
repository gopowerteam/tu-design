import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vite-plus/test";
import { Form, FormField } from "@/components/form";
import type { FormRenderItem } from "../types";
import { renderInputItem } from "./input";

/** Form > FormField > widget vnode 的最小宿主；field 捕获到外部供断言 */
function makeHost(
  options: Parameters<typeof renderInputItem>[0],
  item: FormRenderItem<{ keyword: string }> = { key: "keyword", title: "关键词" },
) {
  const box: { field: any } = { field: undefined };
  const Host = defineComponent({
    setup() {
      const form = useForm({
        defaultValues: { keyword: "init" },
        validators: {},
      });
      return () =>
        h(
          Form,
          { form },
          {
            default: () =>
              h(
                FormField,
                { name: "keyword" },
                {
                  default: ({ field }: any) => {
                    box.field = field;
                    return renderInputItem<{ keyword: string }>(options)({
                      field,
                      item,
                      values: { keyword: "init" },
                    });
                  },
                },
              ),
          },
        );
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, input: wrapper.find("input"), box };
}

describe("renderInputItem", () => {
  it("回显 field.state.value", () => {
    const { input } = makeHost({});
    expect((input.element as HTMLInputElement).value).toBe("init");
  });

  it("输入写回 field.handleChange", async () => {
    const { input, box } = makeHost({});
    await input.setValue("abc");
    expect(box.field.state.value).toBe("abc");
  });

  it("blur 触发 field.handleBlur（isTouched）", async () => {
    const { input, box } = makeHost({});
    expect(box.field.state.meta.isTouched).toBe(false);
    await input.trigger("blur");
    expect(box.field.state.meta.isTouched).toBe(true);
  });

  it("placeholder/type 透传，componentProps 可追加", () => {
    const { input } = makeHost(
      { placeholder: "搜索…", type: "search" },
      { key: "keyword", title: "关键词", componentProps: { "data-x": "1" } },
    );
    expect(input.attributes("placeholder")).toBe("搜索…");
    expect(input.attributes("type")).toBe("search");
    expect(input.attributes("data-x")).toBe("1");
  });
});
