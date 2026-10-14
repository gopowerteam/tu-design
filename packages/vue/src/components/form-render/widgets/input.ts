import { h } from "vue";
import { Input } from "@/components/input";
import type { InputWidgetOptions, WidgetRenderReturn } from "../types";
import { MODEL_VALUE, bindField } from "./bind";

/** input widget：单行文本输入（placeholder 为原生 attr 透传，aria-invalid 由 FormControl 接线） */
export function renderInputItem<T extends object>(
  options: InputWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Input, {
      placeholder: ctx.item.placeholder,
      ...options,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}
