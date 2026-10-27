<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TPopover v-for="p in placements" :key="p.value" :positioning="{ placement: p.value }">
      <TPopoverTrigger as-child>
        <TButton variant="outline" size="sm">{{ p.label }}</TButton>
      </TPopoverTrigger>
      <TPopoverContent class="w-48">
        <p class="text-sm">{{ p.label }}方弹出（placement: {{ p.value }}）</p>
      </TPopoverContent>
    </TPopover>
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
