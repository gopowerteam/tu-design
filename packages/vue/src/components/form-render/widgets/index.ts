import type { WidgetRenders } from "../types";
import { renderInputItem } from "./input";

/**
 * widget 注册表：`r.input({...})` 等柯里化工厂的运行时对象。
 * Phase 2 逐个补齐（number/password/currency/textarea/select/checkbox/switch/
 * radioGroup/slider/datePicker/monthPicker/yearPicker/dateRangePicker）。
 */
export function widgetRenders<T extends object>(): WidgetRenders<T> {
  return {
    input: renderInputItem<T>,
    render: (fn) => fn,
  };
}
