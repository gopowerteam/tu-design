<script setup lang="ts">
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { cn } from "@/lib/utils";

interface Props {
  /** 当前值（配合 v-model:value）；不传时为非受控 */
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  class?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{ "update:value": [value: string] }>();
</script>

<template>
  <ArkRadioGroup.Root
    :model-value="props.value"
    :default-value="props.defaultValue"
    :disabled="props.disabled"
    :orientation="props.orientation"
    :class="cn('grid gap-2', props.class)"
    @update:model-value="(value: string) => emit('update:value', value)"
  >
    <slot />
  </ArkRadioGroup.Root>
</template>
