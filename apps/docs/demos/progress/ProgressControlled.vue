<script setup lang="ts">
import { ref } from "vue";

const value = ref(20);

function step(delta: number) {
  value.value = Math.min(100, Math.max(0, value.value + delta));
}
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <TProgress v-model:value="value" label="上传进度" />
    <div class="flex items-center gap-2">
      <TButton size="sm" @click="step(15)">+15%</TButton>
      <TButton variant="outline" size="sm" @click="value = 20">重置</TButton>
      <span class="text-muted-foreground text-xs">当前：{{ value }}%</span>
    </div>
  </div>
</template>
