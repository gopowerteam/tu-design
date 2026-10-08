<script setup lang="ts">
import type { PropType } from "vue";
import { Field as ArkField } from "@ark-ui/vue/field";
import { cn } from "@/lib/utils";

const props = defineProps({
  /** 校验失败态；不传时由使用方自行判断（default: undefined 禁用 Boolean casting） */
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  class: { type: String, default: undefined },
});
</script>

<template>
  <ArkField.Root
    :invalid="props.invalid"
    :disabled="props.disabled"
    :required="props.required"
    :class="cn('flex flex-col gap-1.5', props.class)"
  >
    <slot />
  </ArkField.Root>
</template>
