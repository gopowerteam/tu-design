<script setup lang="ts">
import { ref } from "vue";

const value = ref<number | null>(42);
</script>

<template>
  <div class="w-full max-w-sm space-y-2">
    <TNumberInput v-model="value" :min="0" :max="100" :step="1" class="w-full" />
    <p class="text-muted-foreground text-xs">
      当前值：{{ value === null ? "（空）" : value }}；清空输入时归一为 null
    </p>
  </div>
</template>
