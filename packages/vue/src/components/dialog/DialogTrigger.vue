<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";

interface Props {
  /** 以默认插槽子元素为渲染目标（样式与行为合并其上），不渲染额外按钮 */
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkDialog.Trigger :as-child="props.asChild">
    <slot />
  </ArkDialog.Trigger>
</template>
