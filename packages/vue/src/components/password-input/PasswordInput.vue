<script setup lang="ts">
import type { PropType } from "vue";
import { computed, provide, ref } from "vue";
import { PasswordInput as ArkPasswordInput } from "@ark-ui/vue/password-input";
import { cn } from "@/lib/utils";
import { PASSWORD_INPUT_KEY } from "./context";

const props = defineProps({
  /** 受控值；undefined 走内部非受控 */
  modelValue: { type: String as PropType<string | undefined>, default: undefined },
  /** 明文显示；undefined 走内部非受控（默认隐藏） */
  // default: undefined 禁用 Boolean casting（Checkbox/Dialog 同款约定）
  visible: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  autoComplete: {
    type: String as PropType<"current-password" | "new-password">,
    default: "current-password",
  },
  disabled: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  invalid: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "update:visible": [visible: boolean];
}>();

// zag password-input 不管理 value（原生 input 自管），值链路由 T 家族自建
const internalValue = ref("");
const current = computed(() =>
  props.modelValue === undefined ? internalValue.value : props.modelValue,
);

function setValue(value: string) {
  internalValue.value = value;
  emit("update:modelValue", value);
}

provide(PASSWORD_INPUT_KEY, { current, setValue });

// visible 对 Ark Root 恒走受控模式，非受控语义由内部 ref 实现（Checkbox 同款）
const internalVisible = ref(false);
const isVisible = computed(() => props.visible ?? internalVisible.value);

function handleVisibleChange(details: { visible: boolean }) {
  internalVisible.value = details.visible;
  emit("update:visible", details.visible);
}
</script>

<template>
  <ArkPasswordInput.Root
    :visible="isVisible"
    :auto-complete="props.autoComplete"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="cn('relative w-full', props.class)"
    @visibility-change="handleVisibleChange"
  >
    <slot />
  </ArkPasswordInput.Root>
</template>
