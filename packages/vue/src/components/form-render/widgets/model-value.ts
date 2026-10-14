import { h } from "vue";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { MonthPicker } from "@/components/month-picker";
import { NumberInput } from "@/components/number-input";
import { PasswordInput } from "@/components/password-input";
import { Textarea } from "@/components/textarea";
import { YearPicker } from "@/components/year-picker";
import type {
  CurrencyWidgetOptions,
  NumberWidgetOptions,
  PasswordWidgetOptions,
  PickerWidgetOptions,
  TextareaWidgetOptions,
  WidgetRenderReturn,
} from "../types";
import { MODEL_VALUE, bindField } from "./bind";

/** password widget：密码输入（autoComplete 对应原生 autocomplete） */
export function renderPasswordItem<T extends object>(
  options: PasswordWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(PasswordInput, {
      placeholder: options.placeholder ?? ctx.item.placeholder,
      autoComplete: options.autoComplete,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

/** number widget：数值输入（modelValue: number|null） */
export function renderNumberItem<T extends object>(
  options: NumberWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(NumberInput, {
      min: options.min,
      max: options.max,
      step: options.step,
      formatOptions: options.formatOptions,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

/** currency widget：金额输入（labelUnit/valueUnit 单位展示） */
export function renderCurrencyItem<T extends object>(
  options: CurrencyWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(CurrencyInput, {
      labelUnit: options.labelUnit,
      valueUnit: options.valueUnit,
      placeholder: options.placeholder ?? ctx.item.placeholder,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

/** textarea widget：多行文本（placeholder/rows 为原生 attr 透传） */
export function renderTextareaItem<T extends object>(
  options: TextareaWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(Textarea, {
      placeholder: options.placeholder ?? ctx.item.placeholder,
      rows: options.rows,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

/** 日期类 widget 共用工厂（DatePicker/MonthPicker/YearPicker 同为 string|null 形态） */
function pickerRenderer<T extends object>(
  component: Parameters<typeof h>[0],
  options: PickerWidgetOptions,
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(component, {
      placeholder: options.placeholder ?? ctx.item.placeholder,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

export function renderDatePickerItem<T extends object>(
  options: PickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer<T>(DatePicker, options);
}

export function renderMonthPickerItem<T extends object>(
  options: PickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer<T>(MonthPicker, options);
}

export function renderYearPickerItem<T extends object>(
  options: PickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer<T>(YearPicker, options);
}

/** dateRangePicker widget：[start, end] | null 形态 */
export function renderDateRangePickerItem<T extends object>(
  options: PickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(DateRangePicker, {
      placeholder: options.placeholder,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}
