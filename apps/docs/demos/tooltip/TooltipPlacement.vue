<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TTooltip v-for="p in placements" :key="p.value" :positioning="{ placement: p.value }">
      <TTooltipTrigger as-child>
        <TButton variant="outline" size="sm">{{ p.label }}</TButton>
      </TTooltipTrigger>
      <TTooltipContent>{{ p.label }}方弹出（placement: {{ p.value }}）</TTooltipContent>
    </TTooltip>
  </div>
</template>

<script setup lang="ts">
const placements = [
  { value: "top", label: "上方" },
  { value: "right", label: "右方" },
  { value: "bottom", label: "下方" },
  { value: "left", label: "左方" },
];
</script>
