<script setup lang="ts">
import { ref } from "vue";

const brightness = ref([60]);
</script>

<template>
  <div class="flex w-72 flex-col gap-1">
    <div class="text-muted-foreground flex justify-between text-xs">
      <span>亮度</span>
      <span>{{ brightness[0] }}%</span>
    </div>
    <!-- v-model 载荷恒为 number[]，即使单值传 number 也回传数组 -->
    <TSlider v-model="brightness" />
  </div>
</template>
