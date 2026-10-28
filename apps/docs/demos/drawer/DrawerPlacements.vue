<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TDrawer v-for="p in placements" :key="p.value" :placement="p.value" title="四向抽屉">
      <template #trigger>
        <TButton variant="outline">{{ p.label }}</TButton>
      </template>
      <p class="text-sm text-muted-foreground">从{{ p.label }}滑出；进出场动画随方向自适应。</p>
    </TDrawer>
  </div>
</template>

<script setup lang="ts">
const placements = [
  { value: "top", label: "顶部弹出" },
  { value: "right", label: "右侧弹出（默认）" },
  { value: "bottom", label: "底部弹出" },
  { value: "left", label: "左侧弹出" },
] as const;
</script>
