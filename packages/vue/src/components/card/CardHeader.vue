<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div
    data-slot="card-header"
    :class="
      cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6',
        'has-data-[slot=card-action]:grid-cols-[minmax(0,1fr)_auto]',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
