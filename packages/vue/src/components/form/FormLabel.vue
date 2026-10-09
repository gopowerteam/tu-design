<script setup lang="ts">
import { computed, inject } from "vue";
import { cn } from "@/lib/utils";
import { FIELD_KEY } from "./context";

const fieldCtx = inject(FIELD_KEY)!;
const props = defineProps<{ class?: string }>();

const isInvalid = computed(() => (fieldCtx.field.value?.state.meta.errors.length ?? 0) > 0);
</script>

<template>
  <label
    :for="fieldCtx.name"
    :data-invalid="isInvalid ? '' : undefined"
    :class="cn('text-sm font-medium leading-none data-invalid:text-destructive', props.class)"
  >
    <slot />
  </label>
</template>
