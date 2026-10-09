<script setup lang="ts">
import { ref } from "vue";

const value = ref<number | null>(42);
</script>

<template>
  <div class="w-72 space-y-2">
    <TNumberInput v-model="value" :min="0" :max="100" :step="1">
      <TNumberInputDecrement>−</TNumberInputDecrement>
      <TNumberInputInput />
      <TNumberInputIncrement>+</TNumberInputIncrement>
    </TNumberInput>
    <p class="text-sm text-muted-foreground">当前值：{{ value === null ? "（空）" : value }}</p>
  </div>
</template>
