import { h } from "vue";
import { RadioGroup, RadioGroupItem } from "@/components/radio-group";
import { Slider } from "@/components/slider";
import { normalizeSelectItem } from "@/components/select/types";
import type { RadioGroupWidgetOptions, SliderWidgetOptions, WidgetRenderReturn } from "../types";
import { SLIDER, VALUE, bindField } from "./bind";

/** radioGroup widget：单选组（值 prop 为 value；options 映射 RadioGroupItem，label 为插槽文本） */
export function renderRadioGroupItem<T extends object>(
  options: RadioGroupWidgetOptions,
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(
      RadioGroup,
      {
        orientation: options.orientation,
        ...bindField(ctx.field, VALUE),
        ...ctx.item.componentProps,
      },
      {
        default: () =>
          options.options.map((option) => {
            const normalized = normalizeSelectItem(option);
            return h(
              RadioGroupItem,
              { key: normalized.value, value: normalized.value },
              { default: () => normalized.label },
            );
          }),
      },
    );
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
      min: options.min,
      max: options.max,
      step: options.step,
      ...bindField(ctx.field, SLIDER),
      ...ctx.item.componentProps,
    });
}
