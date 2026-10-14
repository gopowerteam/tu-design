import { h } from "vue";
import { Checkbox } from "@/components/checkbox";
import { Switch } from "@/components/switch";
import type { CheckboxWidgetOptions, SwitchWidgetOptions, WidgetRenderReturn } from "../types";
import { CHECKED, bindField } from "./bind";

/**
 * checkbox/switch widget：boolean 形态（值 prop 为 checked，非 modelValue）。
 * 单行布局倾向 hideLabel + label 经 item.title 展示由使用者决定。
 */
export function renderCheckboxItem<T extends object>(
  options: CheckboxWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Checkbox, {
      ...options,
      ...bindField(ctx.field, CHECKED),
      ...ctx.item.componentProps,
    });
}

export function renderSwitchItem<T extends object>(
  options: SwitchWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Switch, {
      ...options,
      ...bindField(ctx.field, CHECKED),
      ...ctx.item.componentProps,
    });
}
