<script setup lang="ts">
import { defineAsyncComponent, ref } from "vue";
import { getHighlighter } from "./shiki";

const props = defineProps<{ file: string }>();

const demoModules = import.meta.glob("../../demos/**/*.vue");
const demoSources = import.meta.glob("../../demos/**/*.vue", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const key = `../../demos/${props.file}`;
const source = demoSources[key];
// 注：SSG 渲染层会吞掉 setup 抛出的错误（组件静默渲染为空），
// 因此缺失时显式渲染错误占位而非 throw（见 ledger Task 3 Ruling）。
const missing = source === undefined;

const demo = missing ? null : defineAsyncComponent(demoModules[key]!);

const html = missing
  ? ""
  : await getHighlighter().then((h) =>
      h.codeToHtml(source, {
        lang: "vue",
        themes: { light: "github-light", dark: "github-dark" },
      }),
    );

const open = ref(false);
const copied = ref(false);

function copyCode() {
  if (source === undefined) return;
  navigator.clipboard.writeText(source).then(() => {
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  });
}
</script>

<template>
  <div v-if="missing" class="tu-demo-missing">[DemoPreview] demo 不存在: {{ props.file }}</div>
  <div v-else class="tu-demo-container">
    <div class="tu-demo">
      <component :is="demo" />
    </div>
    <div class="tu-demo-toolbar">
      <button class="tu-demo-action" type="button" @click="open = !open">
        {{ open ? "收起源码" : "查看源码" }}
      </button>
      <button class="tu-demo-action" type="button" @click="copyCode">
        {{ copied ? "已复制" : "复制" }}
      </button>
    </div>
    <div v-show="open" class="tu-demo-code" v-html="html" />
  </div>
</template>

<style>
.tu-demo-container {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
  margin: 16px 0;
}

.tu-demo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  background-color: var(--vp-c-bg);
  min-height: 96px;
}

.tu-demo-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--vp-c-divider);
  background-color: var(--vp-c-bg-soft);
}

.tu-demo-action {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  background-color: transparent;
  cursor: pointer;
}

.tu-demo-action:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
}

.tu-demo-code {
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
}

.tu-demo-code pre {
  margin: 0 !important;
  padding: 16px !important;
  border-radius: 0 !important;
}

.tu-demo-missing {
  margin: 16px 0;
  padding: 16px;
  border: 1px dashed var(--vp-c-danger-1, #cc0000);
  border-radius: 8px;
  color: var(--vp-c-danger-1, #cc0000);
  font-family: monospace;
  font-size: 13px;
}
</style>
