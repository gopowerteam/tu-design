import { h } from "vue";
import { Input } from "@/components/input";
import type { InputWidgetOptions, WidgetRenderReturn } from "../types";
import { bindField } from "./bind";

/** input widget：单行文本输入（placeholder 为原生 attr 透传，aria-invalid 由 FormControl 接线） */
export function renderInputItem<T extends object>(
  options: InputWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Input, {
      placeholder: options.placeholder,
      type: options.type,
      ...bindField(ctx.field, "modelValue"),
      ...ctx.item.componentProps,
    });
}
