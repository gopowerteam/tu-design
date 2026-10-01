<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";

interface Props {
  /** 以默认插槽子元素为渲染目标，行为合并其上 */
  asChild?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkMenu.Trigger :as-child="props.asChild">
    <slot />
  </ArkMenu.Trigger>
</template>
