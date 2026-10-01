<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";

interface Props {
  /** 以默认插槽子元素为渲染目标，不渲染额外按钮 */
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkDialog.CloseTrigger :as-child="props.asChild">
    <slot />
  </ArkDialog.CloseTrigger>
</template>
