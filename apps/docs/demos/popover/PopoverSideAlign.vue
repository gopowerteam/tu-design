<template>
  <div class="mx-auto grid w-max grid-cols-3 gap-3">
    <TPopover v-for="p in combos" :key="p.placement" :side="p.side" :align="p.align">
      <TButton variant="outline" size="sm">{{ p.label }}</TButton>
      <template #content>
        <p class="text-sm">{{ p.label }}（side: {{ p.side }} / align: {{ p.align }}）</p>
      </template>
    </TPopover>
  </div>
</template>

<script setup lang="ts">
const combos = [
  { side: "top", align: "start", label: "上左" },
  { side: "top", align: "center", label: "上中" },
  { side: "top", align: "end", label: "上右" },
  { side: "bottom", align: "start", label: "下左" },
  { side: "bottom", align: "center", label: "下中" },
  { side: "bottom", align: "end", label: "下右" },
  { side: "left", align: "center", label: "左中" },
  { side: "right", align: "center", label: "右中" },
] as const;
</script>
