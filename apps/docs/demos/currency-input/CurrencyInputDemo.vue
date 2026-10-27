<script setup lang="ts">
import { ref } from "vue";

// v-model 以 valueUnit（元）为单位，number | null；空输入归一 null
const amount = ref<number | null>(15000);
</script>

<template>
  <div class="space-y-2">
    <TCurrencyInput v-model="amount" placeholder="0.00" class="w-72" />
    <p class="text-xs text-muted-foreground">
      当前值：{{ amount === null ? "（空）" : `${amount} 元` }}
    </p>
  </div>
</template>
