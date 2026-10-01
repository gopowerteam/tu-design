<script setup lang="ts">
import type { PropType } from "vue";
import { computed, ref } from "vue";
import { Checkbox as ArkCheckbox } from "@ark-ui/vue/checkbox";
import { cn } from "@/lib/utils";

// checked 用 default: undefined 禁用 Boolean casting（Dialog 同款约定）
const props = defineProps({
  checked: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  defaultChecked: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  class: { type: String, default: undefined },
});

const emit = defineEmits<{ "update:checked": [checked: boolean] }>();

// 对 Root 恒走受控模式，非受控语义由内部 ref 实现（Dialog 同款）
const internalChecked = ref(props.defaultChecked);
const isChecked = computed(() => props.checked ?? internalChecked.value);

function handleUpdate(checked: boolean) {
  internalChecked.value = checked;
  emit("update:checked", checked);
}
</script>

<template>
  <ArkCheckbox.Root
    :checked="isChecked"
    :disabled="props.disabled"
    :class="cn('inline-flex items-center gap-2', props.class)"
    @update:checked="handleUpdate"
  >
    <ArkCheckbox.HiddenInput />
    <ArkCheckbox.Control
      class="border-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 peer size-4 shrink-0 rounded-[4px] border bg-transparent shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ArkCheckbox.Indicator class="flex items-center justify-center text-current">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-3.5"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </ArkCheckbox.Indicator>
    </ArkCheckbox.Control>
    <ArkCheckbox.Label v-if="$slots.default" class="text-sm leading-none font-medium select-none">
      <slot />
    </ArkCheckbox.Label>
  </ArkCheckbox.Root>
</template>
