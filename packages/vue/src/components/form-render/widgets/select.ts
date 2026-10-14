import { h } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueText,
} from "@/components/select";
import { normalizeSelectItem } from "@/components/select/types";
import type { SelectWidgetOptions, WidgetRenderReturn } from "../types";
import { MODEL_VALUE, bindField } from "./bind";

/**
 * select widget：多子组件组装（Root + Trigger(ValueText) + Content(Items)）。
 * options 直接作为 Select 的 items（其内部做 string 归一化），Item 渲染 label。
 */
export function renderSelectItem<T extends object>(
  options: SelectWidgetOptions,
): WidgetRenderReturn<T> {
  return (ctx) =>
    h(
      Select,
      {
        items: options.options,
        ...bindField(ctx.field, MODEL_VALUE),
        ...ctx.item.componentProps,
      },
      {
        default: () => [
          h(SelectTrigger, () =>
            h(SelectValueText, {
              placeholder: options.placeholder ?? ctx.item.placeholder,
            }),
          ),
          h(SelectContent, () =>
            options.options.map((option) => {
              const normalized = normalizeSelectItem(option);
              return h(SelectItem, { key: normalized.value, item: normalized });
            }),
          ),
        ],
      },
    );
}
