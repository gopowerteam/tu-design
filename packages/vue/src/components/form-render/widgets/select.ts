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
 * v3 命名穿透：options 整体透传给 Select（原生 items prop，内部做 string 归一化）；
 * placeholder 解构出来给 SelectValueText（透传到 Root 会成为无效 DOM attr）。
 */
export function renderSelectItem<T extends object>(
  options: SelectWidgetOptions,
): WidgetRenderReturn<T> {
  const { placeholder, items, ...rootProps } = options;
  return (ctx) =>
    h(
      Select,
      {
        ...rootProps,
        items,
        ...bindField(ctx.field, MODEL_VALUE),
        ...ctx.item.componentProps,
      },
      {
        default: () => [
          h(SelectTrigger, () =>
            h(SelectValueText, {
              placeholder: placeholder ?? ctx.item.placeholder,
            }),
          ),
          h(SelectContent, () =>
            items.map((option) => {
              const normalized = normalizeSelectItem(option);
              return h(SelectItem, { key: normalized.value, item: normalized });
            }),
          ),
        ],
      },
    );
}
