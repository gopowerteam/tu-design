<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted } from "vue";
import { cn } from "@/lib/utils";
import { FIELD_KEY, FORM_ITEM_KEY } from "./context";

const fieldCtx = inject(FIELD_KEY)!;
const itemCtx = inject(FORM_ITEM_KEY)!;

const props = defineProps<{
  /** 静态提示文案：传入后即使无校验错误也渲染（不走 aria-errormessage） */
  message?: string;
  class?: string;
}>();

const errorText = computed(() => {
  if (props.message) return props.message;
  const raw = fieldCtx.field.value?.state.meta.errors[0];
  if (raw === undefined) return undefined;
  return typeof raw === "string" ? raw : raw?.message;
});

onMounted(() => (itemCtx.hasMessage.value = true));
onUnmounted(() => (itemCtx.hasMessage.value = false));
</script>

<template>
  <p v-if="errorText" :id="itemCtx.messageId" :class="cn('text-destructive text-sm', props.class)">
    {{ errorText }}
  </p>
</template>
