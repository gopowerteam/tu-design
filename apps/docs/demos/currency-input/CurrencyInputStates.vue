<script setup lang="ts">
import { ref } from "vue";

const saved = ref(9999.99);
const wrong = ref<number | null>(null);
</script>

<template>
  <div class="space-y-3">
    <TCurrencyInput v-model="saved" disabled class="w-72" />
    <TCurrencyInput v-model="wrong" invalid placeholder="超出余额" class="w-72" />
    <p class="text-xs text-muted-foreground">
      disabled 整体禁用（单位后缀同步降透明度）；invalid 显示 destructive 边框与焦点环。
    </p>
  </div>
</template>
