<script setup lang="ts">
import { ref } from "vue";

// v-model 为 ["yyyy-MM-dd", "yyyy-MM-dd"] 有序元组，null 表示空
const range = ref<[string, string] | null>(["2026-10-01", "2026-10-15"]);
</script>

<template>
  <div class="space-y-2">
    <TDateRangePicker v-model="range" placeholder="请选择日期范围" class="w-80" />
    <p class="text-sm text-muted-foreground">
      当前值：{{ range ? `${range[0]} ~ ${range[1]}` : "（空）" }}
    </p>
  </div>
</template>
