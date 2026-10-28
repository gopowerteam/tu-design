<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { createListCollection } from "@ark-ui/vue/collection";
import { Select as ArkSelect } from "@ark-ui/vue/select";
import { cn } from "@/lib/utils";
import { normalizeSelectItem, type SelectItemOption } from "./types";

// modelValue 为 String 类型无 Boolean casting 问题；「未传」经 default: undefined 保持 undefined
const props = defineProps({
  /** 选项列表：字符串（label = value）或 { label, value, disabled? } */
  items: { type: Array as PropType<(string | SelectItemOption)[]>, required: true },
  /** 当前值（配合 v-model）；不传时为非受控 */
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  defaultValue: { type: String, default: undefined },
  /** 弹层开合受控；undefined 走内部非受控（default: undefined 禁用 Boolean casting） */
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  /** 未选中时触发器显示的占位文案 */
  placeholder: { type: String, default: "请选择" },
  /** 透传合并到触发器（Trigger）的 class */
  triggerClass: { type: String, default: undefined },
  /** 透传合并到弹层（Content）的 class */
  contentClass: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [open: boolean];
}>();

// zag select 的 value 内部统一为数组，这里保持单选 string 的公开语义
const toArray = (v: string | undefined) => (v === undefined ? undefined : [v]);

// 对 Root 恒走受控模式（DatePicker 同款）：非受控语义由内部 ref 实现
const internalValue = ref<string | undefined>(props.defaultValue);
const modelValue = computed(() => props.modelValue ?? internalValue.value);

// 一次归一化（string → { label, value }），v-for 与 #item 插槽作用域共用
const normalizedItems = computed(() =>
  props.items.map((raw) => ({ raw, item: normalizeSelectItem(raw) })),
);

const collection = computed(() =>
  createListCollection({
    items: normalizedItems.value.map((entry) => entry.item),
    isItemDisabled: (item) => item.disabled === true,
  }),
);

function handleModelUpdate(next: string | string[]) {
  const value = Array.isArray(next) ? next[0]! : next;
  internalValue.value = value;
  emit("update:modelValue", value);
}

const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleOpenUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}
</script>

<template>
  <ArkSelect.Root
    :collection="collection"
    :model-value="toArray(modelValue)"
    :open="isOpen"
    @update:model-value="handleModelUpdate"
    @update:open="handleOpenUpdate"
  >
    <!-- 触发器（收编自 SelectTrigger：内置选中回显与 chevron） -->
    <ArkSelect.Control class="w-fit">
      <ArkSelect.Trigger
        :class="
          cn(
            'border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
            props.triggerClass,
          )
        "
      >
        <!-- 注意：不能向 ValueText 传插槽内容，其内部会对默认插槽做字符串化渲染 -->
        <ArkSelect.ValueText :placeholder="props.placeholder" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4 opacity-50"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </ArkSelect.Trigger>
    </ArkSelect.Control>

    <ArkSelect.Positioner class="z-50">
      <ArkSelect.Content
        :class="
          cn(
            'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
            props.contentClass,
          )
        "
      >
        <ArkSelect.Item
          v-for="entry in normalizedItems"
          :key="entry.item.value"
          :item="entry.item"
          class="data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
        >
          <slot
            name="item"
            :item="entry.raw"
            :label="entry.item.label"
            :selected="entry.item.value === modelValue"
          >
            <ArkSelect.ItemText>{{ entry.item.label }}</ArkSelect.ItemText>
            <ArkSelect.ItemIndicator class="absolute right-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </ArkSelect.ItemIndicator>
          </slot>
        </ArkSelect.Item>
      </ArkSelect.Content>
    </ArkSelect.Positioner>
  </ArkSelect.Root>
</template>
