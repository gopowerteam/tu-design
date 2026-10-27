<script setup lang="ts">
import { ref } from "vue";

// labelUnit 是界面输入单位，valueUnit 是存储单位；换算双向：外部赋值会反算回显
const wan = ref<number | null>(15000);
const cents = ref<number | null>(null);
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-2">
      <TCurrencyInput
        v-model="wan"
        label-unit="万"
        value-unit="元"
        placeholder="0.00"
        class="w-72"
      />
      <p class="text-xs text-muted-foreground">
        按「万」输入、按「元」存储：输入 1.5 万，值为 {{ wan }} 元
      </p>
    </div>
    <div class="space-y-2">
      <TCurrencyInput
        v-model="cents"
        label-unit="分"
        value-unit="元"
        placeholder="输入分值"
        class="w-72"
      />
      <p class="text-xs text-muted-foreground">
        按「分」输入、按「元」存储：输入 250，值为
        {{ cents === null ? "（空）" : `${cents} 元` }}
      </p>
    </div>
  </div>
</template>
