<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-wrap items-center justify-center gap-2">
      <TButton
        v-for="p in placements"
        :key="p.value"
        variant="outline"
        size="sm"
        @click="toast.info({ title: `弹出位置：${p.label}` })"
      >
        {{ p.label }}
      </TButton>
    </div>
    <p class="text-xs text-muted-foreground">
      弹出位置由应用根部 <code>&lt;ToastProvider&gt;</code> 的
      <code>placement</code> 决定（当前站点为 bottom-end）；上游渲染层暂不支持单条 toast 覆盖位置
    </p>
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
