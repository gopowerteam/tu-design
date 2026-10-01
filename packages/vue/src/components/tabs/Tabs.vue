<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";

interface Props {
  /** 当前激活的 tab 值（配合 v-model:value）；不传时为非受控 */
  value?: string;
  defaultValue?: string;
  /** 切换模式：automatic 悬停聚焦即切换 / manual 需点击或 Enter */
  activationMode?: "automatic" | "manual";
  lazyMount?: boolean;
  unmountOnExit?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:value": [value: string] }>();
</script>

<template>
  <ArkTabs.Root
    :model-value="props.value"
    :default-value="props.defaultValue"
    :activation-mode="props.activationMode"
    :lazy-mount="props.lazyMount"
    :unmount-on-exit="props.unmountOnExit"
    @update:model-value="(value: string) => emit('update:value', value)"
  >
    <slot />
  </ArkTabs.Root>
</template>
