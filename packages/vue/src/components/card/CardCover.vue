<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <div
    data-slot="card-cover"
    :class="cn('-mx-px -mt-px overflow-hidden rounded-t-[inherit]', props.class)"
  >
    <slot />
  </div>
</template>
