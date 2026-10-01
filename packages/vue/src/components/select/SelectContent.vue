<script setup lang="ts">
import { Select as ArkSelect } from "@ark-ui/vue/select";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkSelect.Positioner class="z-50">
    <ArkSelect.Content
      :class="
        cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
          props.class,
        )
      "
    >
      <slot />
    </ArkSelect.Content>
  </ArkSelect.Positioner>
</template>
