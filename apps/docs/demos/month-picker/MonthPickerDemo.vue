<script setup lang="ts">
import { ref } from "vue";

const month = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-wrap items-start gap-6">
    <div class="space-y-2">
      <TMonthPicker v-model="month" />
      <p class="text-sm text-muted-foreground">
        基础用法，已选 <code>{{ month ?? "未选择" }}</code>
      </p>
    </div>

    <div class="space-y-2">
      <TMonthPicker model-value="2026-03" min="2026-03" max="2026-10" />
      <p class="text-sm text-muted-foreground">min/max 边界（2026-03 ~ 2026-10，含端点）</p>
    </div>

    <div class="space-y-2">
      <TMonthPicker disabled model-value="2026-01" />
      <p class="text-sm text-muted-foreground">disabled</p>
    </div>
  </div>
</template>
