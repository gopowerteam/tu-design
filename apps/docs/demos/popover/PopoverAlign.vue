<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TPopover v-for="a in aligns" :key="a.value" :align="a.value">
      <TButton variant="outline" size="sm">{{ a.label }}</TButton>
      <template #content>
        <p class="text-sm">面板以{{ a.label }}弹出（align: "{{ a.value }}"）</p>
      </template>
    </TPopover>
  </div>
</template>

<script setup lang="ts">
const aligns = [
  { value: "start", label: "起点对齐" },
  { value: "center", label: "居中对齐" },
  { value: "end", label: "终点对齐" },
] as const;
</script>
