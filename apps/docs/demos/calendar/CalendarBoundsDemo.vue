<script setup lang="ts">
import { ref } from "vue";

function fmt(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const date = ref<string | null>(null);
// 可选窗口：今天起 14 天内
const min = fmt(new Date());
const max = fmt(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

function isWeekend(dateValue: { dayOfWeek: number }): boolean {
  return dateValue.dayOfWeek === 0 || dateValue.dayOfWeek === 6;
}
</script>

<template>
  <div class="flex flex-wrap items-start justify-center gap-6">
    <div class="flex flex-col items-center gap-3">
      <TCalendar v-model="date" :min="min" :max="max" class="rounded-md border" />
      <p class="text-xs text-muted-foreground">min / max 限定今天起 14 天，界外日期置灰不可点。</p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TCalendar v-model="date" :is-date-unavailable="isWeekend" class="rounded-md border" />
      <p class="text-xs text-muted-foreground">isDateUnavailable：周末划线置灰，不可选中。</p>
    </div>
  </div>
</template>
