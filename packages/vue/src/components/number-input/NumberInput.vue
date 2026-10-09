<script setup lang="ts">
import type { PropType } from "vue";
import { computed, provide, ref } from "vue";
import { NumberInput as ArkNumberInput } from "@ark-ui/vue/number-input";
import { cn } from "@/lib/utils";
import { NUMBER_INPUT_KEY } from "./context";
import { numberOrNull } from "./utils";

const props = defineProps({
  /** 受控值：number 或 null（空）；undefined 走内部非受控 */
  modelValue: { type: Number as PropType<number | null | undefined>, default: undefined },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  step: { type: Number, default: undefined },
  formatOptions: { type: Object as PropType<Intl.NumberFormatOptions>, default: undefined },
  // default: undefined 禁用 Boolean casting（Checkbox/Dialog 同款约定）
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{ "update:modelValue": [value: number | null] }>();

provide(NUMBER_INPUT_KEY, true);

// 对 Ark Root 恒走受控模式，非受控语义由内部 ref 实现（Checkbox 同款）
const internalValue = ref<number | null>(null);
const current = computed(() =>
  props.modelValue === undefined ? internalValue.value : props.modelValue,
);

/** number → Ark 受控 string（null/NaN → 空串） */
const arkValue = computed(() =>
  current.value == null || Number.isNaN(current.value) ? "" : String(current.value),
);

/** Ark details（value: string / valueAsNumber: number）→ number|null（空串/NaN 归一 null） */
function handleValueChange(details: { value: string; valueAsNumber: number }) {
  const next = numberOrNull(details);
  internalValue.value = next;
  emit("update:modelValue", next);
}
</script>

<template>
  <ArkNumberInput.Root
    :model-value="arkValue"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :format-options="props.formatOptions"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="cn('flex items-stretch', props.class)"
    @value-change="handleValueChange"
  >
    <slot />
  </ArkNumberInput.Root>
</template>
