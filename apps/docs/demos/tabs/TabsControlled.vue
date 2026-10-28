<script setup lang="ts">
import { ref } from "vue";

const value = ref("overview");

const items = [
  { value: "overview", label: "概览" },
  { value: "analytics", label: "分析" },
  { value: "reports", label: "报告" },
];

const contents: Record<string, string> = {
  overview: "最近 30 天的访问量与转化率总览。",
  analytics: "访问来源、留存与漏斗分析。",
  reports: "导出周期性报告与订阅设置。",
};
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TTabs v-model:value="value" :items="items" class="w-96">
      <template #panel="{ item }">
        <p class="pt-3 text-sm text-muted-foreground">{{ contents[item.value] }}</p>
      </template>
    </TTabs>
    <p class="text-sm text-muted-foreground">当前激活：{{ value }}</p>
  </div>
</template>
