<script setup lang="ts">
import { computed, inject } from "vue";
import { cn } from "@/lib/utils";
import { FORM_ITEM_KEY } from "./context";

const itemCtx = inject(FORM_ITEM_KEY)!;
const props = defineProps<{ class?: string }>();

const isInvalid = computed(() => itemCtx.isInvalid.value);
</script>

<template>
  <label
    :for="itemCtx.controlId"
    :data-invalid="isInvalid ? '' : undefined"
    :class="cn('text-sm font-medium leading-none data-invalid:text-destructive', props.class)"
  >
    <slot />
  </label>
</template>
