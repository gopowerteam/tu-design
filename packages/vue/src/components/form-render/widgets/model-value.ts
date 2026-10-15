import type { Component } from "vue";
import { h } from "vue";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { MonthPicker } from "@/components/month-picker";
import { NumberInput } from "@/components/number-input";
import { PasswordInput } from "@/components/password-input";
import { Textarea } from "@/components/textarea";
import { WeekPicker } from "@/components/week-picker";
import { YearPicker } from "@/components/year-picker";
import type {
  CurrencyWidgetOptions,
  DatePickerWidgetOptions,
  DateRangeWidgetOptions,
  MonthPickerWidgetOptions,
  NumberWidgetOptions,
  PasswordWidgetOptions,
  TextareaWidgetOptions,
  WeekPickerWidgetOptions,
  WidgetRenderReturn,
  YearPickerWidgetOptions,
} from "../types";
import { MODEL_VALUE, bindField } from "./bind";

/**
 * modelValue 形态 widgets 统一展开模式（方案 C）：
 * item 级缺省 → options 整体展开（命名穿透，组件全 props）→ 受控绑定 → 逃逸口。
 * options.placeholder 为 undefined 时 Vue 视为未传，item 级缺省保留（I1 语义）。
 */

/** password widget：密码输入（autoComplete 为组件真实 prop，直接派生透传） */
export function renderPasswordItem<T extends object>(
  options: PasswordWidgetOptions = {},
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(PasswordInput, {
      placeholder: ctx.item.placeholder,
      ...options,
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
      ...options,
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
      placeholder: ctx.item.placeholder,
      ...options,
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
      placeholder: ctx.item.placeholder,
      ...options,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

/**
 * 日期类 widget 共用工厂：入口各自携带强类型（DatePicker/Month/Year/DateRange 的
 * props 面互不相同，见 types.ts 各派生接口），内部共享实现无需重复泛型关联。
 */
function pickerRenderer(component: Component, options: object): WidgetRenderReturn<any> {
  return (ctx) =>
    h(component, {
      placeholder: ctx.item.placeholder,
      ...options,
      ...bindField(ctx.field, MODEL_VALUE),
      ...ctx.item.componentProps,
    });
}

export function renderDatePickerItem<T extends object>(
  options: DatePickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer(DatePicker, options);
}

export function renderMonthPickerItem<T extends object>(
  options: MonthPickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer(MonthPicker, options);
}

export function renderYearPickerItem<T extends object>(
  options: YearPickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer(YearPicker, options);
}

/** dateRangePicker widget：[start, end] | null 形态 */
export function renderDateRangePickerItem<T extends object>(
  options: DateRangeWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer(DateRangePicker, options);
}

export function renderWeekPickerItem<T extends object>(
  options: WeekPickerWidgetOptions = {},
): WidgetRenderReturn<T> {
  return pickerRenderer(WeekPicker, options);
}
