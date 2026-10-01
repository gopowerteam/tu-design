<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";

interface Props {
  /** 分组的可访问名称 */
  label?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkMenu.ItemGroup :label="props.label">
    <slot />
  </ArkMenu.ItemGroup>
</template>
