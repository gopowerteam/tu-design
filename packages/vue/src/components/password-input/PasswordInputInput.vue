<script setup lang="ts">
import { computed, inject } from "vue";
import { PasswordInput as ArkPasswordInput } from "@ark-ui/vue/password-input";
import { cn } from "@/lib/utils";
import { PASSWORD_INPUT_KEY } from "./context";

const props = defineProps({ class: { type: String, default: undefined } });

const ctx = inject(PASSWORD_INPUT_KEY) ?? false;
if (!ctx) {
  console.warn("[tu-design] <PasswordInputInput> 必须在 <PasswordInput> 内使用");
}

const value = computed(() => (ctx ? ctx.current.value : ""));

function onInput(event: Event) {
  if (ctx) ctx.setValue((event.target as HTMLInputElement).value);
}
</script>

<template>
  <ArkPasswordInput.Input
    v-if="ctx"
    :value="value"
    :class="
      cn(
        'border-input bg-transparent flex h-9 w-full rounded-md border px-3 py-1 pr-10 text-sm shadow-sm transition-[color,box-shadow] outline-none data-invalid:border-destructive data-invalid:ring-destructive/20 data-invalid:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @input="onInput"
  />
</template>
