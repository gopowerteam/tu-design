<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkDialog.Title :class="cn('text-lg font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </ArkDialog.Title>
</template>
