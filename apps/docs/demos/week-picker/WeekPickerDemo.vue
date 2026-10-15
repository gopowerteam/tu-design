<script setup lang="ts">
import { ref } from "vue";

const week = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-wrap items-start gap-6">
    <div class="space-y-2">
      <TWeekPicker v-model="week" />
      <p class="text-sm text-muted-foreground">
        基础用法，已选周 <code>{{ week ?? "未选择" }}</code>
      </p>
    </div>

    <div class="space-y-2">
      <TWeekPicker model-value="2026-10-12" min="2026-10-05" max="2026-10-25" />
      <p class="text-sm text-muted-foreground">min/max 边界（2026-10-05 ~ 2026-10-25，含端点）</p>
    </div>

    <div class="space-y-2">
      <TWeekPicker disabled model-value="2026-03-02" />
      <p class="text-sm text-muted-foreground">disabled</p>
    </div>
  </div>
</template>
