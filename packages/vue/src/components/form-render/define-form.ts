import { useFormRender, type UseFormRenderOptions } from "./useFormRender";
import type { FormRenderDefinition, FormRenderItem } from "./types";

export interface DefineFormOptions<T extends object> {
  items: FormRenderItem<T>[];
  /** Standard Schema（valibot v.object 输出直接兼容），映射到 TanStack validators.onSubmit */
  schema?: unknown;
  onSubmit?: (ctx: { value: T }) => void | Promise<void>;
  /** 其余 TanStack useForm 选项透传（如 onSubmitInvalid） */
  formOptions?: Record<string, unknown>;
}

/**
 * 聚合入口：单次调用完成「字段定义 + 类型约束 + 表单实例」。
 *
 * 返回 `{ items, form, resetToDefaults }`：
 * - `items` / `form` 传给 `<FormRender>`（支持 `:definition` 单 prop 或 `:form` + `:items` 拆分）；
 * - `form` 可直接 `reset()` / `validate()` / `handleSubmit()`；
 * - `resetToDefaults()` 重置到 `items.default`（搜索表单"重置"语义）。
 *
 * 须在组件 setup 中调用（TanStack useForm 约束）。
 */
export function defineForm<T extends object>(
  config: DefineFormOptions<T>,
): FormRenderDefinition<T> {
  return useFormRender<T>(config satisfies UseFormRenderOptions<T>);
}
