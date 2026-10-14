import { h } from "vue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValueText,
} from "@/components/select";
import { normalizeSelectItem } from "@/components/select/types";
import type { WidgetItemOption, WidgetRenderReturn } from "../types";
import type { SelectWidgetOptions } from "../types";
import { MODEL_VALUE, bindField } from "./bind";

/**
 * select widget：多子组件组装（Root + Trigger(ValueText) + Content(Items)）。
 * v3 命名穿透：options 整体透传给 Select（原生 items prop，内部做 string 归一化）；
 * placeholder 解构出来给 SelectValueText（透传到 Root 会成为无效 DOM attr）。
 */
export function renderSelectItem<T extends object>(
  options: SelectWidgetOptions,
): WidgetRenderReturn<T> {
  // oxlint typeAware 无法解析 SFC 的 $props 派生（退化为 unknown），items 显式注解
  const { placeholder, items, ...rootProps } = options as {
    placeholder?: string;
    items: WidgetItemOption[];
    [key: string]: unknown;
  };
  return (ctx) =>
    h(
      Select,
      {
        ...rootProps,
        items,
        ...bindField(ctx.field, MODEL_VALUE),
        ...ctx.item.componentProps,
      } as never,
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
