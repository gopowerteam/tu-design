<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <TButton
        v-for="p in placements"
        :key="p.value"
        variant="outline"
        size="sm"
        @click="toast.info({ title: `位置：${p.value}`, placement: p.value })"
      >
        {{ p.label }}
      </TButton>
    </div>
    <p class="text-xs text-muted-foreground">单条 toast 可通过 placement 覆盖 Provider 默认位置</p>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "@/components/toast";

const toast = useToast();

const placements = [
  { value: "top-start", label: "左上" },
  { value: "top", label: "上中" },
  { value: "top-end", label: "右上" },
  { value: "bottom-start", label: "左下" },
  { value: "bottom", label: "下中" },
  { value: "bottom-end", label: "右下" },
] as const;
</script>
