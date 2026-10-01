<script setup lang="ts">
import { Tabs as ArkTabs } from "@ark-ui/vue/tabs";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkTabs.List
    :class="
      cn(
        'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]',
        props.class,
      )
    "
  >
    <slot />
  </ArkTabs.List>
</template>
