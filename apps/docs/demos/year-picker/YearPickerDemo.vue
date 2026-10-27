<script setup lang="ts">
import { ref } from "vue";

const year = ref<string | null>(null);
</script>

<template>
  <div class="flex flex-wrap items-start gap-6">
    <div class="space-y-2">
      <TYearPicker v-model="year" class="w-80" />
      <p class="text-sm text-muted-foreground">
        基础用法，已选 <code>{{ year ?? "未选择" }}</code>
      </p>
    </div>

    <div class="space-y-2">
      <TYearPicker model-value="2026" min="2021" max="2026" class="w-80" />
      <p class="text-sm text-muted-foreground">min/max 边界（2021 ~ 2026，含端点）</p>
    </div>

    <div class="space-y-2">
      <TYearPicker disabled model-value="2024" class="w-80" />
      <p class="text-sm text-muted-foreground">disabled</p>
    </div>
  </div>
</template>
