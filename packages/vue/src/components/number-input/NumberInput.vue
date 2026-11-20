<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref, useAttrs } from "vue";
import { NumberInput as ArkNumberInput } from "@ark-ui/vue/number-input";
import { cn } from "@/lib/utils";
import { useOverlayIds, type OverlayIds } from "../overlay-shared/useOverlayIds";
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

// attrs（id/aria-*）转发给内部真实 input，保证 TLabel/TFormControl 关联
defineOptions({ inheritAttrs: false });

// ids 全量覆盖（无冒号）：规避 wujie patch getElementById 对 zag 缺省冒号 id 的
// SyntaxError 刷屏（详注见 useOverlayIds）。scrubber/label 本库不渲染，覆盖后 miss
// 落到合法选择器静默 null；getCursorId 为 zag 硬编码无覆盖口，本库未渲染 Scrubber
// 不可达。
const attrs = useAttrs();
const { ids: baseIds } = useOverlayIds(attrs, {
  primary: "root",
  parts: ["root", "input", "incrementTrigger", "decrementTrigger", "scrubber", "label"],
});
// $attrs.id 落在真实 input（见模板转发）：同步为 ids.input 缺省覆盖，保证 machine
// getById 与真实 DOM 一致（trackFormControl 表单联动依赖）；用户显式 ids.input 优先。
// computed 合并保持 attrs 响应式（Select 同款契约，勿用 setup 期快照展开）。
const rootIds = computed(() => {
  const id = attrs.id;
  const explicit = (attrs.ids as OverlayIds | undefined)?.input;
  if (typeof id !== "string" || explicit != null) return baseIds.value;
  return { ...baseIds.value, input: id };
});
// $attrs 转发 Input 前剔除 ids：ids 已由 Root :ids 消费，直传会在真实 input 上
// 产生 `ids="[object Object]"` 垃圾属性。
const inputAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.ids;
  return rest;
});

// 对 Ark Root 恒走受控模式，非受控语义由内部 ref 实现（Checkbox 同款）
const internalValue = ref<number | null>(null);
const current = computed(() =>
  props.modelValue === undefined ? internalValue.value : props.modelValue,
);

/** number → Ark 受控 string（null/NaN → 空串） */
const arkValue = computed(() =>
  current.value == null || Number.isNaN(current.value) ? "" : String(current.value),
);

/**
 * Ark details（value: string / valueAsNumber: number）→ number|null（空串/NaN 归一 null）
 * @param details - Ark NumberInput 的 ValueChangeDetails
 */
function handleValueChange(details: { value: string; valueAsNumber: number }) {
  const next = numberOrNull(details);
  internalValue.value = next;
  emit("update:modelValue", next);
}
</script>

<template>
  <ArkNumberInput.Root
    :ids="rootIds"
    :model-value="arkValue"
    :min="props.min"
    :max="props.max"
    :step="props.step"
    :format-options="props.formatOptions"
    :disabled="props.disabled"
    :invalid="props.invalid"
    :class="
      cn(
        'border-input flex h-9 items-stretch overflow-hidden rounded-md border shadow-sm transition-[color,box-shadow] outline-none focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px]',
        props.class,
      )
    "
    @value-change="handleValueChange"
  >
    <ArkNumberInput.DecrementTrigger
      :class="'bg-muted/50 hover:bg-accent flex w-9 shrink-0 items-center justify-center border-r text-muted-foreground text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'"
    >
      <slot name="decrement">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </slot>
    </ArkNumberInput.DecrementTrigger>
    <ArkNumberInput.Input
      v-bind="inputAttrs"
      :class="'bg-transparent flex-1 min-w-0 px-1 text-center text-sm outline-none disabled:cursor-not-allowed'"
    />
    <ArkNumberInput.IncrementTrigger
      :class="'bg-muted/50 hover:bg-accent flex w-9 shrink-0 items-center justify-center border-l text-muted-foreground text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'"
    >
      <slot name="increment">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      </slot>
    </ArkNumberInput.IncrementTrigger>
  </ArkNumberInput.Root>
</template>
