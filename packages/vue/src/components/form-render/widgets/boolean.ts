import { h } from "vue";
import { Checkbox } from "@/components/checkbox";
import { Switch } from "@/components/switch";
import type { WidgetRenderReturn } from "../types";
import { CHECKED, bindField } from "./bind";

/**
 * checkbox/switch widget：boolean 形态（值 prop 为 checked，非 modelValue）。
 * 单行布局倾向 hideLabel + label 经 item.title 展示由使用者决定。
 */
export function renderCheckboxItem<T extends object>(
  options: { disabled?: boolean } = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Checkbox, {
      disabled: options.disabled,
      ...bindField(ctx.field, CHECKED),
      ...ctx.item.componentProps,
    });
}

export function renderSwitchItem<T extends object>(
  options: { disabled?: boolean } = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Switch, {
      disabled: options.disabled,
      ...bindField(ctx.field, CHECKED),
      ...ctx.item.componentProps,
    });
}
