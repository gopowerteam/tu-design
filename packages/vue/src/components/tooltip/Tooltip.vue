<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";

interface Props {
  /** 受控开关（配合 v-model:open）；不传时为非受控 */
  open?: boolean;
  defaultOpen?: boolean;
  /** 悬停多久后显示（毫秒） */
  delayDuration?: number;
  /** 移开后多久隐藏（毫秒） */
  closeDuration?: number;
  lazyMount?: boolean;
  unmountOnExit?: boolean;
}

// open 用 default: undefined 禁用 Boolean casting，保证「未传」可辨（Dialog 同款约定）
const props = defineProps({
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  delayDuration: { type: Number, default: undefined },
  closeDuration: { type: Number, default: undefined },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog 同款）
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}
</script>

<template>
  <ArkTooltip.Root
    :open="isOpen"
    :open-delay="props.delayDuration"
    :close-delay="props.closeDuration"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
  >
    <slot />
  </ArkTooltip.Root>
</template>
