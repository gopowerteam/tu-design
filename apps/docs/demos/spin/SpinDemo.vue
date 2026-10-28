<script setup lang="ts">
import { ref } from "vue";

const spinning = ref(true);
</script>

<template>
  <div class="flex flex-col items-start gap-4">
    <div class="flex items-center gap-2">
      <TSpin />
      <span class="text-sm text-muted-foreground">正在加载…</span>
    </div>

    <TButton variant="outline" size="sm" @click="spinning = !spinning">
      {{ spinning ? "停止旋转" : "开始旋转" }}
    </TButton>

    <p class="text-xs text-muted-foreground">
      独立用法：spinning=false 时不渲染任何内容（无"加载中"状态即无状态元素）。
    </p>
  </div>
</template>
