<script setup lang="ts">
import { ref } from "vue";

const price = ref([20, 80]);
</script>

<template>
  <div class="flex w-72 flex-col gap-1">
    <div class="text-muted-foreground flex justify-between text-xs">
      <span>价格区间（¥）</span>
      <span>{{ price[0] }} – {{ price[1] }}</span>
    </div>
    <TSlider v-model="price" :min="0" :max="200" :step="10" />
    <p class="text-muted-foreground text-xs">传数组即区间双 Thumb；step=10，键盘 ←/→ 步进 10</p>
  </div>
</template>
