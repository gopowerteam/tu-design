<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TCalendar v-model="date" :num-of-months="2" class="rounded-md border" />
    <p class="text-xs text-muted-foreground">
      numOfMonths=2：日视图并排展示两个月，适合跨月选择场景。
    </p>
  </div>
</template>
