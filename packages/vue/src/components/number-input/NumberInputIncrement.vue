<script setup lang="ts">
import { inject } from "vue";
import { NumberInput as ArkNumberInput } from "@ark-ui/vue/number-input";
import { cn } from "@/lib/utils";
import { NUMBER_INPUT_KEY } from "./context";

const props = defineProps({ class: { type: String, default: undefined } });

const hasRoot = inject(NUMBER_INPUT_KEY, false);
if (!hasRoot) {
  console.warn("[tu-design] <NumberInputIncrement> 必须在 <NumberInput> 内使用");
}
</script>

<template>
  <ArkNumberInput.IncrementTrigger
    v-if="hasRoot"
    :class="
      cn(
        'border-input bg-muted/50 hover:bg-accent flex w-9 items-center justify-center border text-sm last:rounded-r-md disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  >
    <slot />
  </ArkNumberInput.IncrementTrigger>
</template>
