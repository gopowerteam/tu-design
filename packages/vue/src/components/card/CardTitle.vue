<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <h3 data-slot="card-title" :class="cn('font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>
