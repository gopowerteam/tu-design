<script setup lang="ts">
import { Field as ArkField } from "@ark-ui/vue/field";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <ArkField.Label
    :class="cn('text-sm font-medium leading-none data-invalid:text-destructive', props.class)"
  >
    <slot />
  </ArkField.Label>
</template>
