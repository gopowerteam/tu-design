<script setup lang="ts">
import { ref } from "vue";

const plan = ref("monthly");

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
    <TRadioGroup v-model:value="plan" variant="segmented" :items="planItems" />
    <TRadioGroup
      v-model:value="plan"
      variant="segmented"
      class="w-full max-w-sm"
      :items="planItems"
    />
    <p class="text-muted-foreground text-xs">
      分段按钮组（第二行 w-full 等宽）：当前 {{ planLabels[plan] ?? plan }}
    </p>
  </div>
</template>
