import type { AnyFieldApi } from "@tanstack/vue-form";

/** 值绑定的三种形态：大多数组件走 modelValue，Checkbox/Switch 走 checked，RadioGroup/Slider 走 value */
export type BindingPropName = "modelValue" | "checked" | "value";

/**
 * TanStack field → 控件 props 的统一绑定：
 * 值回显（field.state.value）+ 写回（handleChange）+ 失焦（handleBlur）。
 */
export function bindField(field: AnyFieldApi, propName: BindingPropName) {
  return {
    [propName]: field.state.value,
    [`onUpdate:${propName}`]: (value: unknown) => field.handleChange(value as never),
    onBlur: field.handleBlur,
  };
}
