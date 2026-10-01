<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  disabled?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkTabs.Trigger
    :value="props.value"
    :disabled="props.disabled"
    :class="
      cn(
        'data-[selected]:bg-background data-[selected]:text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 data-[selected]:shadow-sm',
        props.class,
      )
    "
  >
    <slot />
  </ArkTabs.Trigger>
</template>
