<script setup lang="ts">
import { inject } from "vue";
import { NumberInput as ArkNumberInput } from "@ark-ui/vue/number-input";
import { cn } from "@/lib/utils";
import { NUMBER_INPUT_KEY } from "./context";

const props = defineProps({ class: { type: String, default: undefined } });

const hasRoot = inject(NUMBER_INPUT_KEY, false);
if (!hasRoot) {
  console.warn("[tu-design] <NumberInputInput> 必须在 <NumberInput> 内使用");
}
</script>

<template>
  <ArkNumberInput.Input
    v-if="hasRoot"
    :class="
      cn(
        'border-input bg-transparent h-9 w-12 border-y px-1 text-center text-sm shadow-sm transition-[color,box-shadow] outline-none data-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
