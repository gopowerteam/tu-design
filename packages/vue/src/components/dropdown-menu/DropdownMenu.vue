<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Menu as ArkMenu } from "@ark-ui/vue/menu";

interface Props {
  /** 受控开关（配合 v-model:open）；不传时为非受控 */
  open?: boolean;
  defaultOpen?: boolean;
  lazyMount?: boolean;
  unmountOnExit?: boolean;
}

// open 用 default: undefined 禁用 Boolean casting（Dialog/Tooltip 同款约定）
const props = defineProps({
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
});

const emit = defineEmits<{
  "update:open": [open: boolean];
  /** 选中某个 item 时触发（closeOnSelect 关闭后仍会先发出） */
  select: [details: { value: string }];
}>();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog 同款）
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}

function handleSelect(details: { value: string }) {
  emit("select", details);
}
</script>

<template>
  <ArkMenu.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
    @select="handleSelect"
  >
    <slot />
  </ArkMenu.Root>
</template>
