import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import type { AnyFieldApi } from "@tanstack/vue-form";
import { defineComponent, h, type VNode } from "vue";
import { describe, expect, it } from "vite-plus/test";
import { Checkbox } from "@/components/checkbox";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { MonthPicker } from "@/components/month-picker";
import { NumberInput } from "@/components/number-input";
import { PasswordInput } from "@/components/password-input";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { Select } from "@/components/select";
import { Slider } from "@/components/slider";
import { Switch } from "@/components/switch";
import { YearPicker } from "@/components/year-picker";
import { widgetRenders } from "./index";

/** widget 绑定契约测试宿主：widget vnode 渲染在 FormField 插槽内，field 捕获到外部 */
function makeHost(
  defaultValue: unknown,
  render: (ctx: { field: AnyFieldApi; values: any }) => VNode,
) {
  const box: { field?: AnyFieldApi } = {};
  const Host = defineComponent({
    setup() {
      const form = useForm({ defaultValues: { v: defaultValue } as any });
      return () =>
        h(
          form.Field as never,
          { name: "v" } as never,
          {
            default: ({ field }: any) => {
              box.field = field;
              return render({ field, values: form.state.values as any });
            },
          } as never,
        );
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, field: () => box.field! };
}

const item = { key: "v", title: "字段" } as never;

describe("modelValue 形态 widgets", () => {
  it("password：受控回显 + update:modelValue 写回 + autoComplete 透传", () => {
    const { wrapper, field } = makeHost("secret", (ctx) =>
      widgetRenders<{ v: string }>().password({ autoComplete: "new-password" })({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(PasswordInput);
    expect(comp.props("modelValue")).toBe("secret");
    comp.vm.$emit("update:modelValue", "next");
    expect(field().state.value).toBe("next");
    expect(comp.props("autoComplete")).toBe("new-password");
  });

  it("number：number|null 回显 + 写回 + min/max 透传", () => {
    const { wrapper, field } = makeHost(10, (ctx) =>
      widgetRenders<{ v: number | null }>().number({ min: 1, max: 100 })({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(NumberInput);
    expect(comp.props("modelValue")).toBe(10);
    comp.vm.$emit("update:modelValue", 42);
    expect(field().state.value).toBe(42);
    expect(comp.props("max")).toBe(100);
  });

  it("currency：回显 + 写回 + labelUnit/valueUnit 透传", () => {
    const { wrapper, field } = makeHost(100, (ctx) =>
      widgetRenders<{ v: number | null }>().currency({ labelUnit: "万", valueUnit: "元" })({
        ...ctx,
        item,
      }),
    );
    const comp = wrapper.findComponent(CurrencyInput);
    expect(comp.props("modelValue")).toBe(100);
    comp.vm.$emit("update:modelValue", 999);
    expect(field().state.value).toBe(999);
    expect(comp.props("labelUnit")).toBe("万");
    expect(comp.props("valueUnit")).toBe("元");
  });

  it("textarea：原生 textarea 回显 + 写回 + rows 透传", async () => {
    const { wrapper, field } = makeHost("line", (ctx) =>
      widgetRenders<{ v: string }>().textarea({ rows: 4 })({ ...ctx, item }),
    );
    const el = wrapper.find("textarea");
    expect((el.element as HTMLTextAreaElement).value).toBe("line");
    expect(el.attributes("rows")).toBe("4");
    await el.setValue("two");
    expect(field().state.value).toBe("two");
  });

  it("datePicker：string|null 回显 + 写回", () => {
    const { wrapper, field } = makeHost("2026-01-01", (ctx) =>
      widgetRenders<{ v: string | null }>().datePicker()({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(DatePicker);
    expect(comp.props("modelValue")).toBe("2026-01-01");
    comp.vm.$emit("update:modelValue", "2026-06-15");
    expect(field().state.value).toBe("2026-06-15");
  });

  it("monthPicker / yearPicker：同 datePicker 形态", () => {
    const m = makeHost("2026-01", (ctx) =>
      widgetRenders<{ v: string | null }>().monthPicker()({ ...ctx, item }),
    );
    expect(m.wrapper.findComponent(MonthPicker).props("modelValue")).toBe("2026-01");
    m.wrapper.findComponent(MonthPicker).vm.$emit("update:modelValue", "2026-02");
    expect(m.field().state.value).toBe("2026-02");
    m.wrapper.unmount();

    const y = makeHost("2026", (ctx) =>
      widgetRenders<{ v: string | null }>().yearPicker()({ ...ctx, item }),
    );
    expect(y.wrapper.findComponent(YearPicker).props("modelValue")).toBe("2026");
    y.wrapper.findComponent(YearPicker).vm.$emit("update:modelValue", "2027");
    expect(y.field().state.value).toBe("2027");
  });

  it("dateRangePicker：[start,end]|null 回显 + 写回", () => {
    const { wrapper, field } = makeHost(["2026-01-01", "2026-01-31"], (ctx) =>
      widgetRenders<{ v: [string, string] | null }>().dateRangePicker()({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(DateRangePicker);
    expect(comp.props("modelValue")).toEqual(["2026-01-01", "2026-01-31"]);
    comp.vm.$emit("update:modelValue", ["2026-02-01", "2026-02-28"]);
    expect(field().state.value).toEqual(["2026-02-01", "2026-02-28"]);
  });
});

describe("checked 形态 widgets", () => {
  it.each(["checkbox", "switch"] as const)("%s：boolean 回显 + update:checked 写回", (name) => {
    const Comp = name === "checkbox" ? Checkbox : Switch;
    const { wrapper, field } = makeHost(true, (ctx) =>
      widgetRenders<{ v: boolean }>()[name]()({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(Comp);
    expect(comp.props("checked")).toBe(true);
    comp.vm.$emit("update:checked", false);
    expect(field().state.value).toBe(false);
  });
});

describe("value 形态 widgets", () => {
  it("radioGroup：选项渲染 + value 回显 + update:value 写回", () => {
    const { wrapper, field } = makeHost("b", (ctx) =>
      widgetRenders<{ v: string }>().radioGroup({ options: ["a", "b", "c"] })({ ...ctx, item }),
    );
    const group = wrapper.findComponent(RadioGroup);
    expect(group.props("value")).toBe("b");
    const items = wrapper.findAllComponents(RadioGroupItem);
    expect(items.length).toBe(3);
    expect(items[1].props("value")).toBe("b");
    group.vm.$emit("update:value", "c");
    expect(field().state.value).toBe("c");
  });

  it("slider：number ↔ number[] 转换绑定（value 进、update:modelValue 出）", () => {
    const { wrapper, field } = makeHost(30, (ctx) =>
      widgetRenders<{ v: number }>().slider({ min: 0, max: 100 })({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(Slider);
    expect(comp.props("value")).toEqual([30]);
    comp.vm.$emit("update:modelValue", [42]);
    expect(field().state.value).toBe(42);
    expect(comp.props("min")).toBe(0);
    expect(comp.props("max")).toBe(100);
  });
});

describe("item.placeholder 缺省回退（I1）", () => {
  it("input：options 缺省时回退 item.placeholder", () => {
    const { wrapper } = makeHost("", (ctx) =>
      widgetRenders<{ v: string }>().input()({
        ...ctx,
        item: { key: "v", title: "字段", placeholder: "来自 item" } as never,
      }),
    );
    expect(wrapper.find("input").attributes("placeholder")).toBe("来自 item");
  });

  it("options.placeholder 优先于 item.placeholder", () => {
    const { wrapper } = makeHost("", (ctx) =>
      widgetRenders<{ v: string }>().input({ placeholder: "来自 options" })({
        ...ctx,
        item: { key: "v", title: "字段", placeholder: "来自 item" } as never,
      }),
    );
    expect(wrapper.find("input").attributes("placeholder")).toBe("来自 options");
  });

  it("datePicker：options 缺省时回退 item.placeholder", () => {
    const { wrapper } = makeHost(null, (ctx) =>
      widgetRenders<{ v: string | null }>().datePicker()({
        ...ctx,
        item: { key: "v", title: "字段", placeholder: "选个日期" } as never,
      }),
    );
    expect(wrapper.findComponent(DatePicker).props("placeholder")).toBe("选个日期");
  });
});

describe("select 组装", () => {
  it("items 由 options 映射 + 受控回显 + update:modelValue 写回 + placeholder", () => {
    const { wrapper, field } = makeHost(undefined, (ctx) =>
      widgetRenders<{ v: string | null }>().select({
        options: ["a", { label: "B", value: "b" }],
        placeholder: "请选择",
      })({ ...ctx, item }),
    );
    const comp = wrapper.findComponent(Select);
    expect(comp.props("items")).toEqual(["a", { label: "B", value: "b" }]);
    expect(comp.props("modelValue")).toBeUndefined();
    comp.vm.$emit("update:modelValue", "b");
    expect(field().state.value).toBe("b");
    expect(wrapper.text()).toContain("请选择");
  });

  it("字符串 options 归一化为 { label, value } 供 SelectItem 渲染", () => {
    const { wrapper } = makeHost(null, (ctx) =>
      widgetRenders<{ v: string | null }>().select({ options: ["a"] })({ ...ctx, item }),
    );
    expect(wrapper.text()).toContain("a");
  });
});
