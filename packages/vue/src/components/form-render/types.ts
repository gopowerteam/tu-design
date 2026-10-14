import type { AnyFieldApi, FormApi, VueFormApi } from "@tanstack/vue-form";
import type { VNode } from "vue";
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

/** input widget 选项 */
export interface InputWidgetOptions {
  placeholder?: string;
  /** 原生 input type（text/email/search 等） */
  type?: string;
}

/**
 * widget 注册表类型契约：Phase 2 逐个补齐方法（input → … → dateRangePicker）。
 * 实现对象在 widgets/index.ts；类型集中于此避免循环依赖（type-only import 无运行时环）。
 */
export interface WidgetRenders<T extends object> {
  input(o?: InputWidgetOptions): WidgetRenderReturn<T>;
  /** 逃逸口：完全自定义渲染 */
  render(fn: (ctx: WidgetContext<T>) => VNode): WidgetRenderReturn<T>;
}

export interface FormRenderDefinition<T extends object> {
  items: FormRenderItem<T>[];
  form: FormRenderFormApi;
  /** 重置到 items.default（搜索表单"重置"语义） */
  resetToDefaults: () => void;
}
