<script setup lang="ts">
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  disabled?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkRadioGroup.Item
    :value="props.value"
    :disabled="props.disabled"
    :class="cn('flex items-center gap-2', props.class)"
  >
    <ArkRadioGroup.ItemHiddenInput />
    <ArkRadioGroup.ItemControl
      class="border-input text-primary shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 group aspect-square size-4 shrink-0 rounded-full border outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        class="bg-primary size-2 rounded-full opacity-0 transition-opacity group-data-[state=checked]:opacity-100"
      />
    </ArkRadioGroup.ItemControl>
    <ArkRadioGroup.ItemText v-if="$slots.default" class="text-sm">
      <slot />
    </ArkRadioGroup.ItemText>
  </ArkRadioGroup.Item>
</template>
