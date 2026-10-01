<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";

interface Props {
  /** 受控开关（配合 v-model:open）；不传时为非受控，由内部状态管理 */
  open?: boolean;
  defaultOpen?: boolean;
  /** 首次打开前不挂载内容 */
  lazyMount?: boolean;
  /** 关闭后卸载内容（关闭动画结束后） */
  unmountOnExit?: boolean;
}

// 用运行时 props 显式 default: undefined：Boolean prop 缺省时 Vue 会 cast 成 false，
// 导致无法区分「未传（非受控）」与「传了 false（受控关闭）」。
const props = defineProps({
  open: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  lazyMount: { type: Boolean, default: false },
  unmountOnExit: { type: Boolean, default: false },
});

const emit = defineEmits<{ "update:open": [open: boolean] }>();

// 对 Root 恒走受控模式（open 恒为布尔）：非受控语义由内部 ref 实现，
// 避开 zag uncontrolled 内部状态在部分环境下不同步的问题，两种模式行为一致。
const internalOpen = ref(props.defaultOpen);
const isOpen = computed(() => props.open ?? internalOpen.value);

function handleUpdate(open: boolean) {
  internalOpen.value = open;
  emit("update:open", open);
}
</script>

<template>
  <ArkDialog.Root
    :open="isOpen"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:open="handleUpdate"
  >
    <slot />
  </ArkDialog.Root>
</template>
