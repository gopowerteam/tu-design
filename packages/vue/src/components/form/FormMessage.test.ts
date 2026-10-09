import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import * as v from "valibot";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./index";

afterEach(() => {
  vi.restoreAllMocks();
});

/** 函数校验器：产生 string 形态错误 */
const FN_RULES = {
  onChange: ({ value }: { value: string }) => (value.length < 5 ? "至少 5 个字符" : undefined),
};
/** valibot 校验器：产生 { message } 形态错误（Standard Schema 桥接） */
const SCHEMA_RULES = { onChange: v.pipe(v.string(), v.minLength(5, "至少 5 个字符")) };

/** Form > FormField(rules) > FormItem > [Label, FormControl>input, Description?, Message?] */
function makeHost(options: {
  validators?: Record<string, unknown>;
  withDescription?: boolean;
  withMessage?: boolean;
  message?: string;
}) {
  const showDescription = ref(options.withDescription ?? false);
  const Host = defineComponent({
    setup() {
      const form = useForm({ defaultValues: { email: "" } });
      return () =>
        h(
          Form,
          { form },
          {
            default: () =>
              h(
                FormField,
                { name: "email", validators: options.validators },
                {
                  default: ({ field }: any) =>
                    h(FormItem, null, {
                      default: () => [
                        h(FormLabel, () => "邮箱"),
                        h(FormControl, () =>
                          h("input", {
                            value: field.state.value,
                            onInput: (e: Event) =>
                              field.handleChange((e.target as HTMLInputElement).value),
                          }),
                        ),
                        showDescription.value ? h(FormDescription, () => "我们不会公开邮箱") : null,
                        h(FormMessage, { message: options.message }),
                      ],
                    }),
                },
              ),
          },
        );
    },
  });
  return { w: mount(Host, { attachTo: document.body }), showDescription };
}

describe("FormDescription", () => {
  it("渲染 p 与 id，并翻转 hasDescription", async () => {
    const { w } = makeHost({ withDescription: true });
    const desc = w.find("p#email-form-item-description");
    expect(desc.exists()).toBe(true);
    expect(desc.text()).toBe("我们不会公开邮箱");
    await vi.waitFor(() =>
      expect(w.find("input").attributes("aria-describedby")).toBe("email-form-item-description"),
    );
    w.unmount();
  });

  it("卸载后 hasDescription 复位，describedby 收缩", async () => {
    const { w, showDescription } = makeHost({ withDescription: true });
    await vi.waitFor(() =>
      expect(w.find("input").attributes("aria-describedby")).toBe("email-form-item-description"),
    );

    showDescription.value = false;
    await vi.waitFor(() => expect(w.find("input").attributes("aria-describedby")).toBeUndefined());
    expect(w.find("p#email-form-item-description").exists()).toBe(false);
    w.unmount();
  });
});

describe("FormMessage", () => {
  it("无错误不渲染，hasMessage 为 false", () => {
    const { w } = makeHost({});
    expect(w.find("p#email-form-item-message").exists()).toBe(false);
    expect(w.find("input").attributes("aria-describedby")).toBeUndefined();
    w.unmount();
  });

  it("string 形态错误渲染原文并接线 aria", async () => {
    const { w } = makeHost({ validators: FN_RULES, withMessage: true });
    await w.find("input").setValue("abc");
    await vi.waitFor(() => {
      const msg = w.find("p#email-form-item-message");
      expect(msg.exists()).toBe(true);
      expect(msg.text()).toBe("至少 5 个字符");
      const input = w.find("input");
      expect(input.attributes("aria-invalid")).toBe("true");
      expect(input.attributes("aria-describedby")).toBe("email-form-item-message");
    });
    w.unmount();
  });

  it("{ message } 对象形态错误渲染 message 而非 [object Object]", async () => {
    const { w } = makeHost({ validators: SCHEMA_RULES, withMessage: true });
    await w.find("input").setValue("abc");
    await vi.waitFor(() => {
      const msg = w.find("p#email-form-item-message");
      expect(msg.exists()).toBe(true);
      expect(msg.text()).toBe("至少 5 个字符");
      expect(msg.text()).not.toContain("[object");
    });
    w.unmount();
  });

  it("message prop 覆盖且无错误也渲染", () => {
    const { w } = makeHost({ message: "固定提示" });
    const msg = w.find("p#email-form-item-message");
    expect(msg.exists()).toBe(true);
    expect(msg.text()).toBe("固定提示");
    // 非校验错误场景：不接线 aria-describedby
    expect(w.find("input").attributes("aria-describedby")).toBeUndefined();
    w.unmount();
  });
});
