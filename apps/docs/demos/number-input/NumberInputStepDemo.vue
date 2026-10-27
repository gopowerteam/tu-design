<script setup lang="ts">
import { ref } from "vue";

const count = ref<number | null>(4);
</script>

<template>
  <div class="w-full max-w-sm space-y-2">
    <TNumberInput v-model="count" :min="0" :max="10" :step="2" class="w-full" />
    <p class="text-muted-foreground text-xs">
      min=0 / max=10 / step=2，当前值：{{ count === null ? "（空）" : count }}；按钮与键盘 ↑↓
      共用步长，手动输入越界值会在失焦时夹取回边界
    </p>
  </div>
</template>
