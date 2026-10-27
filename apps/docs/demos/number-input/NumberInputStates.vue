<script setup lang="ts">
import { ref } from "vue";

const disabledValue = ref<number | null>(10);
const invalidValue = ref<number | null>(999);
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-2">
    <div class="flex flex-col items-center gap-3">
      <TNumberInput v-model="disabledValue" disabled class="w-full" />
      <p class="text-muted-foreground text-center text-xs">disabled，步进按钮与输入同时禁用</p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TNumberInput v-model="invalidValue" :max="100" invalid class="w-full" />
      <p class="text-muted-foreground text-center text-xs">invalid，边框与环套 destructive</p>
    </div>
  </div>
</template>
