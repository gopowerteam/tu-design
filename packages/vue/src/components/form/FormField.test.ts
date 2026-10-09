import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import * as v from "valibot";
import { defineComponent, h, inject } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Form, FormField, FormItem } from "./index";
import { FORM_ITEM_KEY } from "./context";

afterEach(() => {
  vi.restoreAllMocks();
});

/** 注入 FORM_ITEM_KEY 并渲染 id 上下文，供断言 provide 链路 */
const Probe = defineComponent({
  setup() {
    const ctx = inject(FORM_ITEM_KEY)!;
    return () =>
      h("div", { id: "probe", "data-desc": ctx.descriptionId, "data-msg": ctx.messageId });
  },
});

/** 构造 Form > FormField(validators) > slot(input [FormItem(Probe)]) 宿主；form 在 setup 内创建 */
function makeHost(
  options: {
    validators?: Record<string, unknown>;
    withItem?: boolean;
    mode?: "value" | "array";
  } = {},
) {
  const captured: { field?: any } = {};
  const Host = defineComponent({
    setup() {
      const form = useForm({
        defaultValues: options.mode === "array" ? { email: [] as string[] } : { email: "" },
      });
      return () =>
        h(
          Form,
          { form },
          {
            default: () =>
              h(
                FormField,
                { name: "email", validators: options.validators, mode: options.mode },
                {
                  default: ({ field }: any) => {
                    captured.field = field;
                    const children = [
                      h("input", {
                        value: field.state.value,
                        onInput: (e: Event) =>
                          field.handleChange((e.target as HTMLInputElement).value),
                      }),
                    ];
                    if (options.withItem) {
                      children.push(h(FormItem, null, { default: () => h(Probe) }));
                    }
                    return children;
                  },
                },
              ),
          },
        );
    },
  });
  return { w: mount(Host, { attachTo: document.body }), captured };
}

const EMAIL_RULES = { onChange: v.pipe(v.string(), v.minLength(5, "至少 5 个字符")) };

describe("FormField", () => {
  it("在 <Form> 外使用时开发期告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mount(FormField, { props: { name: "email" }, slots: { default: () => "x" } });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("Form"));
    w.unmount();
  });

  it("作用域插槽暴露 field（name 一致）", () => {
    const { w, captured } = makeHost();
    expect(captured.field?.name).toBe("email");
    w.unmount();
  });

  it("输入触发 valibot 校验并产生错误", async () => {
    const { w, captured } = makeHost({ validators: EMAIL_RULES });
    await w.find("input").setValue("abc");
    await vi.waitFor(() => expect(captured.field?.state.meta.errors.length).toBeGreaterThan(0));
    w.unmount();
  });

  it("mode=array 透传：pushValue/removeValue 操作行值", async () => {
    const { w, captured } = makeHost({ mode: "array" });
    expect(captured.field?.state.value).toEqual([]);
    captured.field.pushValue("a");
    await vi.waitFor(() => expect(captured.field.state.value).toEqual(["a"]));
    captured.field.removeValue(0);
    await vi.waitFor(() => expect(captured.field.state.value).toEqual([]));
    w.unmount();
  });
});

describe("FormItem", () => {
  it("提供静态 id 上下文（实例级唯一，以字段名结尾）", () => {
    const { w } = makeHost({ withItem: true });
    const probe = w.find("#probe");
    expect(String(probe.attributes("data-desc")).endsWith("email-form-item-description")).toBe(
      true,
    );
    expect(String(probe.attributes("data-msg")).endsWith("email-form-item-message")).toBe(true);
    w.unmount();
  });

  it("校验错误时 data-invalid 翻转", async () => {
    const { w } = makeHost({ validators: EMAIL_RULES, withItem: true });
    const item = w.find("#probe").element.closest(".group")!;
    expect(item.hasAttribute("data-invalid")).toBe(false);

    await w.find("input").setValue("abc");
    await vi.waitFor(() => expect(item.hasAttribute("data-invalid")).toBe(true));
    w.unmount();
  });
});
