<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <TCalendar v-model="date" mode="month" class="rounded-md border" />
    <p class="text-xs text-muted-foreground">
      mode="month"：锁定月视图，点年份标题还可继续上钻年视图。
    </p>
  </div>
</template>
