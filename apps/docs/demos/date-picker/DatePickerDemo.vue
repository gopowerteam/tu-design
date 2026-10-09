<script setup lang="ts">
import { ref } from "vue";

// v-model 为 "yyyy-MM-dd" 字符串，null 表示空
const date = ref<string | null>("2026-10-09");
</script>

<template>
  <div class="w-72 space-y-2">
    <TDatePicker v-model="date" placeholder="请选择日期" />
    <p class="text-sm text-muted-foreground">当前值：{{ date ?? "（空）" }}</p>
  </div>
</template>
