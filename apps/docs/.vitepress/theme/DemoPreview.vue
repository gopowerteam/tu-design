<script setup lang="ts">
import DemoPreviewAsync from "./DemoPreviewAsync.vue";

defineProps<{ file: string }>();
</script>

<template>
  <!--
    自备 Suspense 边界：dev 客户端渲染树无 Suspense，
    async setup 组件需在此等待（SSR 端 SSG 渲染同样走这里）。
  -->
  <Suspense>
    <DemoPreviewAsync :file="file" />
    <template #fallback>
      <div class="tu-demo-container tu-demo-loading">加载中…</div>
    </template>
  </Suspense>
</template>

<style>
.tu-demo-loading {
  padding: 32px;
  text-align: center;
  color: var(--vp-c-text-2);
  font-size: 13px;
}
</style>
