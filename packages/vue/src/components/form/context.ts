import type { AnyFieldApi } from "@tanstack/vue-form";
import type { ComputedRef, InjectionKey, Ref, ShallowRef } from "vue";

/** useForm() 返回实例的宽松形态（provide/inject 边界会擦除泛型，any 化是契约）。
 * 注：TS6 对 FormApi<any> 的方法成员按逆变检查（如 pushFieldValue 的 TField 收窄为 never），
 * any 化交集不再能兼容任意具体泛型实例，故契约直接 any 化。 */
export type FormInstance = any;

/** FormField 内部经 form.Field 插槽才能拿到 field 实例，用 ShallowRef 承载 provide 时序 */
export interface FieldContext {
  field: ShallowRef<AnyFieldApi | undefined>;
  name: string;
}

/** FormItem 提供给 FormLabel/FormControl/FormDescription/FormMessage 的静态 id 与 presence 上下文 */
export interface FormItemContext {
  name: string;
  /** 实例级唯一控件 id（useId 前缀 + 字段名），label/控件/aria 均由它派生 */
  controlId: string;
  descriptionId: string;
  messageId: string;
  hasDescription: Ref<boolean>;
  hasMessage: Ref<boolean>;
  isInvalid: ComputedRef<boolean>;
}

export const FORM_KEY: InjectionKey<FormInstance> = Symbol("tu-form");
export const FIELD_KEY: InjectionKey<FieldContext> = Symbol("tu-form-field");
export const FORM_ITEM_KEY: InjectionKey<FormItemContext> = Symbol("tu-form-item");
