<script setup lang="ts">
import { ref } from "vue";

const downloaded = ref(180);
const total = ref(256);
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <TProgress :value="downloaded" :max="total" label="下载" show-value />
    <TProgress :value="64" label="默认量程（max=100）" show-value />
    <p class="text-muted-foreground text-xs">showValue 显示百分比（按 max 归一），max 自定义量程</p>
  </div>
</template>
