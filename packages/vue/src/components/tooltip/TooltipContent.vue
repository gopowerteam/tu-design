<script setup lang="ts">
import { Tooltip as ArkTooltip } from "@ark-ui/vue/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkTooltip.Positioner class="z-50">
    <ArkTooltip.Content
      :class="
        cn(
          'bg-primary text-primary-foreground z-50 w-fit rounded-md px-3 py-1.5 text-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          props.class,
        )
      "
    >
      <slot />
    </ArkTooltip.Content>
  </ArkTooltip.Positioner>
</template>
