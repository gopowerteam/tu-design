<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkTabs.Content :value="props.value" :class="cn('flex-1 outline-none', props.class)">
    <slot />
  </ArkTabs.Content>
</template>
