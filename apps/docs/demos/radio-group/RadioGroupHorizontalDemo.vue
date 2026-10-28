<script setup lang="ts">
import { ref } from "vue";

const lang = ref("zh");

const langItems = [
  { label: "中文", value: "zh" },
  { label: "English", value: "en" },
  { label: "日本語", value: "ja" },
];

const langLabels: Record<string, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TRadioGroup v-model:value="lang" orientation="horizontal" :items="langItems" />
    <p class="text-muted-foreground text-xs">
      横向排列时用 ← / → 键切换；当前语言：{{ langLabels[lang] ?? lang }}
    </p>
  </div>
</template>
