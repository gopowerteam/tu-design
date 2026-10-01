<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { createListCollection } from "@ark-ui/vue/collection";
import { Select as ArkSelect } from "@ark-ui/vue/select";
import type { SelectItemOption } from "./types";

// modelValue 为 String 类型无 Boolean casting 问题；「未传」经 default: undefined 保持 undefined
const props = defineProps({
  /** 选项列表（构建键盘导航/回显所需的 collection） */
  items: { type: Array as PropType<(string | SelectItemOption)[]>, required: true },
  /** 当前值（配合 v-model）；不传时为非受控 */
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  defaultValue: { type: String, default: undefined },
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:open": [open: boolean];
}>();

// zag select 的 value 内部统一为数组，这里保持单选 string 的公开语义
const toArray = (v: string | undefined) => (v === undefined ? undefined : [v]);

// 对 Root 恒走受控模式（Dialog 同款）：非受控语义由内部 ref 实现
const internalValue = ref<string | undefined>(props.defaultValue);
const modelValue = computed(() => props.modelValue ?? internalValue.value);
const collection = computed(() =>
  createListCollection({
    items: props.items.map((item) =>
      typeof item === "string" ? { label: item, value: item } : item,
    ),
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
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:model-value="handleModelUpdate"
    @update:open="handleOpenUpdate"
  >
    <slot />
  </ArkSelect.Root>
</template>
