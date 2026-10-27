<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>(new Date().toISOString().slice(0, 10));
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TCalendar v-model="date" week class="rounded-md border" />
    <p class="text-xs text-muted-foreground">
      week：点击任意一天即选中整周（周起点跟随 locale，默认 zh-CN 周一起）。
    </p>
  </div>
</template>
