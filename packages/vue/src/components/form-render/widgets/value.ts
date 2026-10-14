import { h } from "vue";
import { RadioGroup } from "@/components/radio-group";
import { Slider } from "@/components/slider";
import type { RadioGroupWidgetOptions, SliderWidgetOptions, WidgetRenderReturn } from "../types";
import { SLIDER, VALUE, bindField } from "./bind";

/**
 * radioGroup widget：单选组（值 prop 为 value）。
 * 命名穿透：组件已提供 options 声明式选项 prop（内部归一化 string），整体直传，
 * widget 不再组装 RadioGroupItem。
 */
export function renderRadioGroupItem<T extends object>(
  options: RadioGroupWidgetOptions,
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(RadioGroup, {
      ...options,
      ...bindField(ctx.field, VALUE),
      ...ctx.item.componentProps,
    });
}

/**
 * slider widget：number ↔ number[] 混合绑定特例
 * （值 prop 为 `value`，事件却是 `update:modelValue` 且数组语义，由 SLIDER spec 转换）。
 */
export function renderSliderItem<T extends object>(
  options: SliderWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Slider, {
      ...options,
      ...bindField(ctx.field, SLIDER),
      ...ctx.item.componentProps,
    });
}
