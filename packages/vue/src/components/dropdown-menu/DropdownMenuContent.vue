<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkMenu.Positioner class="z-50">
    <ArkMenu.Content
      :class="
        cn(
          'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          props.class,
        )
      "
    >
      <slot />
    </ArkMenu.Content>
  </ArkMenu.Positioner>
</template>
