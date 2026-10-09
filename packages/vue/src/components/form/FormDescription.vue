<script setup lang="ts">
import { inject, onMounted, onUnmounted } from "vue";
import { cn } from "@/lib/utils";
import { FORM_ITEM_KEY } from "./context";

const itemCtx = inject(FORM_ITEM_KEY)!;
const props = defineProps<{ class?: string }>();

onMounted(() => (itemCtx.hasDescription.value = true));
onUnmounted(() => (itemCtx.hasDescription.value = false));
</script>

<template>
  <p :id="itemCtx.descriptionId" :class="cn('text-muted-foreground text-sm', props.class)">
    <slot />
  </p>
</template>
