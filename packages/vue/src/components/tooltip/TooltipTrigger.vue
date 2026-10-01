<script setup lang="ts">
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";

interface Props {
  /** 以默认插槽子元素为渲染目标，行为合并其上 */
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkTooltip.Trigger :as-child="props.asChild">
    <slot />
  </ArkTooltip.Trigger>
</template>
