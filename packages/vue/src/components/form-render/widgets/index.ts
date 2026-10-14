import type { WidgetRenders } from "../types";
import { renderCheckboxItem, renderSwitchItem } from "./boolean";
import {
  renderCurrencyItem,
  renderDatePickerItem,
  renderDateRangePickerItem,
  renderMonthPickerItem,
  renderNumberItem,
  renderPasswordItem,
  renderTextareaItem,
  renderYearPickerItem,
} from "./model-value";
import { renderInputItem } from "./input";
import { renderSelectItem } from "./select";
import { renderRadioGroupItem, renderSliderItem } from "./value";

/**
 * widget 注册表：`r.input({...})` 等柯里化工厂的运行时对象。
 * 文件按绑定形态聚合：input / model-value（modelValue 系）/ boolean（checked 系）/
 * value（radioGroup/slider）/ select（多子组件组装）。
 */
export function widgetRenders<T extends object>(): WidgetRenders<T> {
  return {
    input: renderInputItem<T>,
    password: renderPasswordItem<T>,
    number: renderNumberItem<T>,
    currency: renderCurrencyItem<T>,
    textarea: renderTextareaItem<T>,
    select: renderSelectItem<T>,
    checkbox: renderCheckboxItem<T>,
    switch: renderSwitchItem<T>,
    radioGroup: renderRadioGroupItem<T>,
    slider: renderSliderItem<T>,
    datePicker: renderDatePickerItem<T>,
    monthPicker: renderMonthPickerItem<T>,
    yearPicker: renderYearPickerItem<T>,
    dateRangePicker: renderDateRangePickerItem<T>,
    render: (fn) => fn,
  };
}
