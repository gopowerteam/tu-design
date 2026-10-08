<script setup lang="ts">
import { Popover as ArkPopover } from "@ark-ui/vue/popover";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkPopover.Positioner class="z-50">
    <ArkPopover.Content
      :class="
        cn(
          'bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          props.class,
        )
      "
    >
      <slot />
    </ArkPopover.Content>
  </ArkPopover.Positioner>
</template>
