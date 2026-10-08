<script setup lang="ts">
import { Field as ArkField } from "@ark-ui/vue/field";
import { cn } from "@/lib/utils";

const props = defineProps<{ class?: string }>();
</script>

<template>
  <ArkField.HelperText :class="cn('text-muted-foreground text-sm', props.class)">
    <slot />
  </ArkField.HelperText>
</template>
