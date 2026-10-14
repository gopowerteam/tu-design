import type { AnyFieldApi, FormApi, VueFormApi } from "@tanstack/vue-form";
import type { VNode } from "vue";
import type { Checkbox } from "@/components/checkbox";
import type { CurrencyInput } from "@/components/currency-input";
import type { DatePicker } from "@/components/date-picker";
import type { DateRangePicker } from "@/components/date-range-picker";
import type { Input } from "@/components/input";
import type { MonthPicker } from "@/components/month-picker";
import type { NumberInput } from "@/components/number-input";
import type { PasswordInput } from "@/components/password-input";
import type { RadioGroup } from "@/components/radio-group";
import type { Select } from "@/components/select";
import type { Slider } from "@/components/slider";
import type { Switch } from "@/components/switch";
import type { Textarea } from "@/components/textarea";
import type { YearPicker } from "@/components/year-picker";
import type { SelectItemOption } from "@/components/select";

/**
 * useForm() 返回实例的宽松形态（与 form/context.ts 的 FormInstance 同款契约：
 * provide/inject 与跨组件边界会擦除泛型，any 化是项目既定约定）。
 */
/* prettier-ignore */
export type FormRenderFormApi =
  FormApi<any, any, any, any, any, any, any, any, any, any, any, any> &
  VueFormApi<any, any, any, any, any, any, any, any, any, any, any, any>;

/** 字段渲染上下文（widget 柯里化第二段的唯一参数） */
export interface WidgetContext<T extends object> {
  field: AnyFieldApi;
  item: FormRenderItem<T>;
  /** 当前全量表单值（响应式，来自 form.useSelector(s => s.values)；联动用） */
  values: T;
}

export type WidgetRenderReturn<T extends object> = (ctx: WidgetContext<T>) => VNode;

/** select/radioGroup 等选项的通用形态（字符串简写或 { label, value }） */
export type WidgetItemOption = string | SelectItemOption;

/**
 * SFC props 类型派生（方案 C）：widget 参数 = 原组件全部 props（命名穿透，
 * prop 变更时类型自动同步）。受控字段由 bindField/FormControl/items.default
 * 接管，用户不可传；Omit 不存在的键是 no-op，统一集合即可。
 */
type ControlledKey =
  | "modelValue"
  | "onUpdate:modelValue"
  | "checked"
  | "onUpdate:checked"
  | "value"
  | "onUpdate:value"
  | "onBlur"
  | "invalid"
  | "class"
  | "id"
  | "defaultValue"
  | "defaultChecked";

export type SfcOptions<T extends abstract new (...args: any) => any> = Partial<
  Omit<InstanceType<T>["$props"], ControlledKey>
>;

// —— 各 widget 选项：组件全 props 派生（命名穿透） ——

export type NumberWidgetOptions = SfcOptions<typeof NumberInput>;

export type CurrencyWidgetOptions = SfcOptions<typeof CurrencyInput>;

/** autoComplete 为 PasswordInput 真实 prop（探针实证），直接派生获得 */
export type PasswordWidgetOptions = SfcOptions<typeof PasswordInput>;

/** Input 自身无 placeholder/type prop（原生 attr 透传），交叉手写 */
export type InputWidgetOptions = SfcOptions<typeof Input> & {
  placeholder?: string;
  type?: string;
};

/** Textarea 自身无 placeholder/rows prop（原生 attr 透传），交叉手写 */
export type TextareaWidgetOptions = SfcOptions<typeof Textarea> & {
  placeholder?: string;
  rows?: number;
};

/**
 * v3 命名穿透：选项字段即组件 prop 名 `items`——显式必填（Partial 化会退化为可选，
 * 缺失时 Select.vue collection 计算在首渲染崩溃）；placeholder 不透传给 Select Root
 * （Omit 在此为前向防御，组件当前无此 prop），解构后仅给 SelectValueText。
 */
export type SelectWidgetOptions = Omit<SfcOptions<typeof Select>, "placeholder" | "items"> & {
  items: WidgetItemOption[];
  placeholder?: string;
};

export type CheckboxWidgetOptions = SfcOptions<typeof Checkbox>;

export type SwitchWidgetOptions = SfcOptions<typeof Switch>;

/** RadioGroup 为纯组装模式（无选项 prop），items 为 DSL 字段（与 Select.items 命名对齐） */
export type RadioGroupWidgetOptions = SfcOptions<typeof RadioGroup> & {
  items: WidgetItemOption[];
};

export type SliderWidgetOptions = SfcOptions<typeof Slider>;

/** picker 三组件 props 面不同（DatePicker 有 isDateUnavailable/max/min，Month/Year 有 locale），各自派生 */
export type DatePickerWidgetOptions = SfcOptions<typeof DatePicker>;

export type MonthPickerWidgetOptions = SfcOptions<typeof MonthPicker>;

export type YearPickerWidgetOptions = SfcOptions<typeof YearPicker>;

export type DateRangeWidgetOptions = SfcOptions<typeof DateRangePicker>;

/**
 * widget 注册表类型契约：实现对象在 widgets/index.ts。
 * 类型集中于此避免循环依赖（type-only import 无运行时环）。
 */
export interface WidgetRenders<T extends object> {
  input(o?: InputWidgetOptions): WidgetRenderReturn<T>;
  password(o?: PasswordWidgetOptions): WidgetRenderReturn<T>;
  number(o?: NumberWidgetOptions): WidgetRenderReturn<T>;
  currency(o?: CurrencyWidgetOptions): WidgetRenderReturn<T>;
  textarea(o?: TextareaWidgetOptions): WidgetRenderReturn<T>;
  select(o: SelectWidgetOptions): WidgetRenderReturn<T>;
  checkbox(o?: CheckboxWidgetOptions): WidgetRenderReturn<T>;
  switch(o?: SwitchWidgetOptions): WidgetRenderReturn<T>;
  radioGroup(o: RadioGroupWidgetOptions): WidgetRenderReturn<T>;
  slider(o?: SliderWidgetOptions): WidgetRenderReturn<T>;
  datePicker(o?: DatePickerWidgetOptions): WidgetRenderReturn<T>;
  monthPicker(o?: MonthPickerWidgetOptions): WidgetRenderReturn<T>;
  yearPicker(o?: YearPickerWidgetOptions): WidgetRenderReturn<T>;
  dateRangePicker(o?: DateRangeWidgetOptions): WidgetRenderReturn<T>;
  /** 逃逸口：完全自定义渲染 */
  render(fn: (ctx: WidgetContext<T>) => VNode): WidgetRenderReturn<T>;
}

export interface FormRenderItem<T extends object> {
  /**
   * 字段名：严格 keyof T —— 自动补全 + 拼错编译报错。
   * 额外字段请在 T 中显式声明；运行时以 String(key) 归一为 FormField 的 name。
   */
  key: keyof T;
  title: string;
  description?: string;
  placeholder?: string;
  /**
   * 默认值（值或同步工厂）；defineForm 据此派生 defaultValues。
   * 类型为 T 值域联合 T[keyof T]（无 per-item 精确联动，强于 x-render 的 any）。
   */
  default?: T[keyof T] | (() => T[keyof T]);
  /** 栅格跨度：数字 = 占 n 列（须 ≤ 实际列数）；"full" = 整行 */
  span?: number | "full";
  /** 联动显隐；消费 FormRender 经 useSelector 建立的响应式 values */
  visible?: boolean | ((values: T) => boolean);
  hideLabel?: boolean;
  class?: string;
  /** TanStack 字段级校验器透传（如 onChangeAsync） */
  validators?: Record<string, unknown>;
  /** widget 描述；缺省 = r.input() */
  render?: (r: WidgetRenders<T>) => WidgetRenderReturn<T>;
  /** 逃逸口：原样合并到控件 vnode 的 props */
  componentProps?: Record<string, unknown>;
}

export interface FormRenderDefinition<T extends object> {
  items: FormRenderItem<T>[];
  form: FormRenderFormApi;
  /** 重置到 items.default（搜索表单"重置"语义） */
  resetToDefaults: () => void;
}
