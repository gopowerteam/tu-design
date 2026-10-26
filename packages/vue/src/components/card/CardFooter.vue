<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div data-slot="card-footer" :class="cn('flex items-center p-6 pt-0', props.class)">
    <slot />
  </div>
</template>
