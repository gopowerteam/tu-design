<script setup lang="ts">
import { ref } from "vue";

const plan = ref("weekly");

const planLabels: Record<string, string> = {
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TRadioGroup v-model:value="plan">
      <TRadioGroupItem value="weekly">每周</TRadioGroupItem>
      <TRadioGroupItem value="monthly">每月</TRadioGroupItem>
      <TRadioGroupItem value="yearly">每年</TRadioGroupItem>
    </TRadioGroup>
    <p class="text-muted-foreground text-xs">当前订阅计划：{{ planLabels[plan] ?? plan }}</p>
  </div>
</template>
