<script setup lang="ts">
import { ref } from "vue";

const plan = ref("weekly");

const planItems = [
  { label: "每周", value: "weekly" },
  { label: "每月", value: "monthly" },
  { label: "每年", value: "yearly" },
];

const planLabels: Record<string, string> = {
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TRadioGroup v-model:value="plan" :items="planItems" />
    <p class="text-muted-foreground text-xs">当前订阅计划：{{ planLabels[plan] ?? plan }}</p>
  </div>
</template>
