<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TCalendar v-model="date" class="rounded-md border" />
    <p class="text-xs text-muted-foreground">
      点击日期选中，当前值：<code>{{ date ?? "未选择" }}</code
      >；点标题可上钻月/年视图，左右箭头翻页。
    </p>
  </div>
</template>
