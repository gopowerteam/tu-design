<script setup lang="ts">
import { ref } from "vue";

// 界面按「分」输入，存储以「元」为单位：输入 250，v-model 得到 0.5
const cents = ref<number | null>(null);
</script>

<template>
  <div class="w-72 space-y-2">
    <TCurrencyInput v-model="cents" label-unit="分" value-unit="元" placeholder="输入分值" />
    <p class="text-sm text-muted-foreground">
      存储值：{{ cents === null ? "（空）" : `${cents} 元` }}
    </p>
  </div>
</template>
