<script setup lang="ts">
import { ref } from "vue";

// v-model 为 ["yyyy-MM-dd", "yyyy-MM-dd"] 有序元组，null 表示空；min/max 边界含当日
const range = ref<[string, string] | null>(null);
</script>

<template>
  <div class="w-96 space-y-2">
    <TDateRangePicker
      v-model="range"
      :min="'2026-01-01'"
      :max="'2026-12-31'"
      placeholder="限 2026 年内"
    />
    <p class="text-sm text-muted-foreground">
      边界外格子禁用，当前值：{{ range ? `${range[0]} ~ ${range[1]}` : "（空）" }}
    </p>
  </div>
</template>
