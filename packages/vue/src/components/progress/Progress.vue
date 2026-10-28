<script setup lang="ts">
import { computed, ref } from "vue";
import { Progress as ArkProgress } from "@ark-ui/vue/progress";
import { cn } from "@/lib/utils";

/** 语义变体 */
type ProgressVariant = "default" | "info" | "success" | "warning" | "error";

const props = withDefaults(
  defineProps<{
    /** 当前值（配合 v-model:value，0 ~ max）；显式传 null 为不确定态 */
    value?: number | null;
    /** 最大值 @default 100 */
    max?: number;
    /** 进度标签文本 */
    label?: string;
    /** 是否显示百分比文本 @default false */
    showValue?: boolean;
    /** 语义变体：default 用 primary，error 映射 destructive @default "default" */
    variant?: ProgressVariant;
    /** 不确定态（忽略 value，恒以 null 传给 Ark） */
    indeterminate?: boolean;
    /** 追加/覆盖根元素样式类 */
    class?: string;
  }>(),
  { max: 100, showValue: false, variant: "default", indeterminate: false },
);

const emit = defineEmits<{ "update:value": [value: number | null] }>();

// —— 受控桥接（Popover 同款）：Root 恒走受控，非受控语义由内部 ref 实现 ——
const internalValue = ref<number | null>(0);
const modelValue = computed<number | null>(() => {
  if (props.indeterminate) return null;
  // 显式传 value（含 null）即受控；未传走内部状态
  return props.value !== undefined ? props.value : internalValue.value;
});

function handleUpdate(value: number | null) {
  internalValue.value = value;
  emit("update:value", value);
}

// variant → 语义 token 着色（default 用 primary）
const rangeClass = computed(
  () =>
    ({
      default: "bg-primary",
      info: "bg-info",
      success: "bg-success",
      warning: "bg-warning",
      error: "bg-destructive",
    })[props.variant],
);
</script>

<template>
  <ArkProgress.Root
    :model-value="modelValue"
    :max="props.max"
    :class="cn('relative flex w-full items-center gap-3', props.class)"
    @update:model-value="handleUpdate"
  >
    <ArkProgress.Label
      v-if="props.label"
      class="text-foreground text-sm font-medium whitespace-nowrap"
    >
      {{ props.label }}
    </ArkProgress.Label>
    <ArkProgress.Track class="bg-muted relative h-2 w-full grow overflow-hidden rounded-full">
      <ArkProgress.Range
        :class="
          cn(
            'h-full rounded-full transition-all duration-300',
            'data-[state=indeterminate]:w-1/2 data-[state=indeterminate]:animate-pulse',
            rangeClass,
          )
        "
      />
    </ArkProgress.Track>
    <ArkProgress.ValueText
      v-if="props.showValue"
      class="text-muted-foreground text-sm leading-none tabular-nums whitespace-nowrap"
    />
  </ArkProgress.Root>
</template>
