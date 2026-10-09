<script setup lang="ts">
import { computed, inject, provide, ref } from "vue";
import { cn } from "@/lib/utils";
import { FIELD_KEY, FORM_ITEM_KEY, type FormItemContext } from "./context";

const fieldCtx = inject(FIELD_KEY)!;

const name = fieldCtx.name;
const descriptionId = `${name}-form-item-description`;
const messageId = `${name}-form-item-message`;
const hasDescription = ref(false);
const hasMessage = ref(false);
const isInvalid = computed(() => (fieldCtx.field.value?.state.meta.errors.length ?? 0) > 0);

provide(FORM_ITEM_KEY, {
  name,
  descriptionId,
  messageId,
  hasDescription,
  hasMessage,
  isInvalid,
} satisfies FormItemContext);
</script>

<template>
  <div :class="cn('group flex flex-col gap-1.5')" :data-invalid="isInvalid ? '' : undefined">
    <slot />
  </div>
</template>
