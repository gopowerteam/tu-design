<script setup lang="ts">
import { ref } from "vue";

const percent = ref<number | null>(0.25);
</script>

<template>
  <div class="w-72 space-y-2">
    <TNumberInput
      v-model="percent"
      :min="0"
      :max="1"
      :step="0.05"
      :format-options="{ style: 'percent', maximumFractionDigits: 1 }"
    />
    <p class="text-sm text-muted-foreground">存储值：{{ percent === null ? "（空）" : percent }}</p>
  </div>
</template>
