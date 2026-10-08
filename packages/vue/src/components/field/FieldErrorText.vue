<script setup lang="ts">
import { Field as ArkField } from "@ark-ui/vue/field";
import { cn } from "@/lib/utils";

// v-if 语义：Ark 仅在 invalid=true 时渲染，否则不产生 DOM 元素
const props = defineProps<{ class?: string }>();
</script>

<template>
  <ArkField.ErrorText :class="cn('text-destructive text-sm', props.class)">
    <slot />
  </ArkField.ErrorText>
</template>
