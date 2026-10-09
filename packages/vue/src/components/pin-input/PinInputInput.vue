<script setup lang="ts">
import { inject } from "vue";
import { PinInput as ArkPinInput } from "@ark-ui/vue/pin-input";
import { cn } from "@/lib/utils";
import { PIN_INPUT_KEY } from "./context";

const props = defineProps({
  /** 格序号（0 起），zag 以此生成 id/焦点序 */
  index: { type: Number, required: true },
  class: { type: String, default: undefined },
});

const hasRoot = inject(PIN_INPUT_KEY, false);
if (!hasRoot) {
  console.warn("[tu-design] <PinInputInput> 必须在 <PinInput> 内使用");
}
</script>

<template>
  <ArkPinInput.Input
    v-if="hasRoot"
    :index="props.index"
    :class="
      cn(
        'border-input bg-transparent h-9 w-9 rounded-md border text-center text-sm shadow-sm transition-[color,box-shadow] outline-none data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
