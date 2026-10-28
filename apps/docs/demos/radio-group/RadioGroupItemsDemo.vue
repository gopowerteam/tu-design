<script setup lang="ts">
import { ref } from "vue";

const interval = ref("daily");

const intervalItems = [
  { label: "每天", value: "daily" },
  { label: "每周", value: "weekly", disabled: true },
  { label: "从不", value: "never" },
];
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TRadioGroup v-model:value="interval" :items="intervalItems" />
    <p class="text-muted-foreground text-xs">「每周」项 disabled 不可选；当前值：{{ interval }}</p>
  </div>
</template>
