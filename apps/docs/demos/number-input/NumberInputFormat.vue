<script setup lang="ts">
import { ref } from "vue";

const percent = ref<number | null>(0.25);
const price = ref<number | null>(1280);
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-2">
    <div class="flex flex-col items-center gap-3">
      <TNumberInput
        v-model="percent"
        :min="0"
        :max="1"
        :step="0.05"
        :format-options="{ style: 'percent', maximumFractionDigits: 1 }"
        class="w-full"
      />
      <p class="text-muted-foreground text-center text-xs">
        百分比样式；存储值：{{ percent === null ? "（空）" : percent }}
      </p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TNumberInput
        v-model="price"
        :min="0"
        :step="10"
        :format-options="{ style: 'currency', currency: 'CNY' }"
        class="w-full"
      />
      <p class="text-muted-foreground text-center text-xs">
        货币样式；存储值：{{ price === null ? "（空）" : price }}
      </p>
    </div>
  </div>
</template>
