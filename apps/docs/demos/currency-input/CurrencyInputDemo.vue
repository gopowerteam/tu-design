<script setup lang="ts">
import { ref } from "vue";

// 界面按「万」输入，v-model 存储以「元」为单位
const amount = ref<number | null>(15000);
</script>

<template>
  <div class="w-72 space-y-2">
    <TCurrencyInput v-model="amount" label-unit="万" value-unit="元" placeholder="0.00" />
    <p class="text-sm text-muted-foreground">输入 1.5 万，存储值为 {{ amount }} 元</p>
  </div>
</template>
