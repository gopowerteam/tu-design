<script setup lang="ts">
import { Popover as ArkPopover } from "@ark-ui/vue/popover";

interface Props {
  /** 以默认插槽子元素为渲染目标，行为合并其上 */
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkPopover.Trigger :as-child="props.asChild">
    <slot />
  </ArkPopover.Trigger>
</template>
