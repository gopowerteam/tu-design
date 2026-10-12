<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-wrap items-start gap-6">
    <div class="space-y-2">
      <TCalendar v-model="date" class="rounded-md border" />
      <p class="text-sm text-muted-foreground">
        standalone（独立形态，默认）：日视图可切换月/年，已选 <code>{{ date ?? "未选择" }}</code>
      </p>
    </div>

    <div class="space-y-2">
      <TCalendar mode="month" class="rounded-md border" />
      <p class="text-sm text-muted-foreground">mode="month"：锁定月视图</p>
    </div>

    <div class="space-y-2">
      <TCalendar mode="year" class="rounded-md border" />
      <p class="text-sm text-muted-foreground">mode="year"：锁定年视图</p>
    </div>
  </div>
</template>
