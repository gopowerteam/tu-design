import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import * as v from "valibot";
import { defineComponent, h } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormSubscribe,
} from "./index";

describe("Form", () => {
  it("渲染 form 元素且 class 合并", () => {
    const form = useForm({ defaultValues: { email: "" } });
    const w = mount(Form, { props: { form, class: "space-y-6" }, attachTo: document.body });
    expect(w.element.tagName).toBe("FORM");
    expect(w.classes()).toContain("space-y-6");
    w.unmount();
  });

  it("submit 阻止默认行为并调用 form.handleSubmit", async () => {
    const form = useForm({ defaultValues: { email: "" }, onSubmit: async () => {} });
    const spy = vi.spyOn(form, "handleSubmit");
    const w = mount(Form, { props: { form }, attachTo: document.body });

    const event = new Event("submit", { cancelable: true });
    w.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it("登录表单集成：校验流转、aria 接线与提交状态", async () => {
    const onSubmit = vi.fn();
    const fieldInput = (field: any, testid: string, type?: string) =>
      h("input", {
        type,
        "data-testid": testid,
        value: field.state.value,
        onInput: (e: Event) => field.handleChange((e.target as HTMLInputElement).value),
      });

    const Host = defineComponent({
      setup() {
        const form = useForm({
          defaultValues: { email: "", password: "" },
          validators: {
            onSubmit: v.object({
              email: v.pipe(v.string(), v.email("邮箱格式不正确")),
              password: v.pipe(v.string(), v.minLength(8, "至少 8 位")),
            }),
          },
          onSubmit: async ({ value }) => onSubmit(value),
        });
        return () =>
          h(
            Form,
            { form },
            {
              default: () => [
                h(
                  FormField,
                  { name: "email" },
                  {
                    default: ({ field }: any) =>
                      h(FormItem, null, {
                        default: () => [
                          h(FormLabel, () => "邮箱"),
                          h(FormControl, () => fieldInput(field, "email")),
                          h(FormMessage),
                        ],
                      }),
                  },
                ),
                h(
                  FormField,
                  { name: "password" },
                  {
                    default: ({ field }: any) =>
                      h(FormItem, null, {
                        default: () => [
                          h(FormLabel, () => "密码"),
                          h(FormControl, () => fieldInput(field, "password", "password")),
                          h(FormMessage),
                        ],
                      }),
                  },
                ),
                h(FormSubscribe, null, {
                  default: (state: any) =>
                    h(
                      "button",
                      { type: "submit", "data-testid": "submit", disabled: !state.canSubmit },
                      state.isSubmitting ? "提交中…" : "提交",
                    ),
                }),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    const email = w.find('[data-testid="email"]');
    const password = w.find('[data-testid="password"]');
    const button = w.find('[data-testid="submit"]');

    // 初始：按钮可点，无错误
    expect(button.attributes("disabled")).toBeUndefined();

    // 提交失败：校验错误落到字段，aria 接线 + 错误文案渲染
    await email.setValue("not-an-email");
    await password.setValue("short");
    await w.find("form").trigger("submit");
    await vi.waitFor(() => {
      expect(email.attributes("aria-invalid")).toBe("true");
      expect(password.attributes("aria-invalid")).toBe("true");
      expect(w.text()).toContain("邮箱格式不正确");
      expect(w.text()).toContain("至少 8 位");
    });
    expect(onSubmit).not.toHaveBeenCalled();

    // 修正后提交成功
    await email.setValue("user@example.com");
    await password.setValue("long-enough-pw");
    await w.find("form").trigger("submit");
    await vi.waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "long-enough-pw",
      }),
    );
    w.unmount();
  });
});
