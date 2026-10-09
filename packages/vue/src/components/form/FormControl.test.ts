import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import * as v from "valibot";
import { defineComponent, h, inject, onMounted, onUnmounted } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./index";
import { FORM_ITEM_KEY } from "./context";

afterEach(() => {
  vi.restoreAllMocks();
});

const EMAIL_RULES = { onChange: v.pipe(v.string(), v.minLength(5, "至少 5 个字符")) };

/** presence 开关：挂载即翻转 hasDescription / hasMessage（模拟 FormDescription/FormMessage） */
const DescPresence = defineComponent({
  setup() {
    const ctx = inject(FORM_ITEM_KEY)!;
    onMounted(() => (ctx.hasDescription.value = true));
    onUnmounted(() => (ctx.hasDescription.value = false));
    return () => h("p", { id: ctx.descriptionId }, "提示文案");
  },
});
const MsgPresence = defineComponent({
  setup() {
    const ctx = inject(FORM_ITEM_KEY)!;
    onMounted(() => (ctx.hasMessage.value = true));
    onUnmounted(() => (ctx.hasMessage.value = false));
    return () => h("p", { id: ctx.messageId }, "错误文案");
  },
});

/** Form > FormField > FormItem > children(field) */
function makeHost(options: {
  validators?: Record<string, unknown>;
  children: (field: any) => any;
}) {
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
                    h(FormItem, null, { default: () => options.children(field) }),
                },
              ),
          },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("FormLabel", () => {
  it("for 指向字段名，校验错误时 data-invalid 翻转", async () => {
    const w = makeHost({
      validators: EMAIL_RULES,
      children: (field) => [
        h(FormLabel, () => "邮箱"),
        h(FormControl, () =>
          h("input", {
            value: field.state.value,
            onInput: (e: Event) => field.handleChange((e.target as HTMLInputElement).value),
          }),
        ),
      ],
    });
    const label = w.find("label");
    expect(label.attributes("for")).toBe("email");
    expect(label.element.hasAttribute("data-invalid")).toBe(false);

    await w.find("input").setValue("abc");
    await vi.waitFor(() => expect(label.element.hasAttribute("data-invalid")).toBe(true));
    w.unmount();
  });
});

describe("FormControl", () => {
  it("子元素获得 id，无错误时无 aria-invalid/describedby", () => {
    const w = makeHost({ children: () => [h(FormControl, () => h("input"))] });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("email");
    expect(input.attributes("aria-invalid")).toBeUndefined();
    expect(input.attributes("aria-describedby")).toBeUndefined();
    w.unmount();
  });

  it("description 存在时 describedby 指向它", async () => {
    const w = makeHost({
      children: () => [h(DescPresence), h(FormControl, () => h("input"))],
    });
    await vi.waitFor(() =>
      expect(w.find("input").attributes("aria-describedby")).toBe("email-form-item-description"),
    );
    w.unmount();
  });

  it("invalid 且 message 存在时 describedby 追加 messageId 且 aria-invalid 翻转", async () => {
    const w = makeHost({
      validators: EMAIL_RULES,
      children: (field) => [
        h(MsgPresence),
        h(FormControl, () =>
          h("input", {
            value: field.state.value,
            onInput: (e: Event) => field.handleChange((e.target as HTMLInputElement).value),
          }),
        ),
      ],
    });
    await w.find("input").setValue("abc");
    await vi.waitFor(() => {
      const input = w.find("input");
      expect(input.attributes("aria-invalid")).toBe("true");
      expect(input.attributes("aria-describedby")).toContain("email-form-item-message");
    });
    w.unmount();
  });

  it("多子元素时开发期告警", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = makeHost({ children: () => [h(FormControl, () => [h("input"), h("input")])] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("FormControl"));
    w.unmount();
  });
});
