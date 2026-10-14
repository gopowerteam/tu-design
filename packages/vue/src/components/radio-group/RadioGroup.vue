<script setup lang="ts">
import { computed, ref, useSlots } from "vue";
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { cn } from "@/lib/utils";
import RadioGroupItem from "./RadioGroupItem.vue";

// 声明式选项；string 快捷写法等价于 { label, value } 同值
interface RadioGroupOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface Props {
  /** 当前值（配合 v-model:value）；不传时为非受控（内部 ref 维护） */
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  /** 原生表单提交字段名 */
  name?: string;
  /** 关联的 form id */
  form?: string;
  required?: boolean;
  readOnly?: boolean;
  /** 校验无效态；zag 会级联 data-invalid 到 root/item/item-control */
  invalid?: boolean;
  orientation?: "horizontal" | "vertical";
  /** 声明式选项；与默认插槽同时提供时插槽优先 */
  options?: (string | RadioGroupOption)[];
  class?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:value": [value: string] }>();

const slots = useSlots();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Checkbox/Dialog 同款约定）
const internalValue = ref<string | null>(props.defaultValue ?? null);
const currentValue = computed(() => props.value ?? internalValue.value);

// Ark 的 update:modelValue 实际类型为 string | null（单选交互不会产生 null，仅作守卫）
function handleUpdate(value: string | null) {
  if (value === null) return;
  internalValue.value = value;
  emit("update:value", value);
}

// 规范化 options：string → { label, value }
const normalizedOptions = computed<RadioGroupOption[]>(() =>
  (props.options ?? []).map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  ),
);

if (import.meta.env.DEV && slots.default && props.options?.length) {
  console.warn("[tu-design] <RadioGroup> 默认插槽与 options 同时提供，插槽优先，options 将被忽略");
}
</script>

<template>
  <ArkRadioGroup.Root
    :model-value="currentValue"
    :disabled="props.disabled"
    :name="props.name"
    :form="props.form"
    :required="props.required"
    :read-only="props.readOnly"
    :invalid="props.invalid"
    :orientation="props.orientation"
    :class="cn('grid gap-2', props.class)"
    @update:model-value="handleUpdate"
  >
    <slot v-if="$slots.default" />
    <template v-else>
      <RadioGroupItem
        v-for="option in normalizedOptions"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </RadioGroupItem>
    </template>
  </ArkRadioGroup.Root>
</template>
