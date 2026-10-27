<script setup lang="ts">
import { ref } from "vue";

const loading = ref(false);

function reload() {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 1800);
}
</script>

<template>
  <div class="w-full max-w-md space-y-4">
    <TButton variant="outline" size="sm" :disabled="loading" @click="reload">
      {{ loading ? "加载中…" : "重新加载" }}
    </TButton>

    <div class="flex items-center gap-4 rounded-xl border p-4" :aria-busy="loading">
      <template v-if="loading">
        <TSkeleton class="size-12 rounded-full" />
        <div class="flex-1 space-y-2">
          <TSkeleton class="h-4 w-1/3" />
          <TSkeleton class="h-3 w-2/3" />
        </div>
      </template>
      <template v-else>
        <div
          class="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
        >
          ZC
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium">钟楚同</p>
          <p class="text-xs text-muted-foreground">前端工程师 · 专注于组件库与设计系统</p>
        </div>
      </template>
    </div>
  </div>
  <p class="text-xs text-muted-foreground">
    加载切换：点击按钮重新请求（setTimeout 1.8s 模拟），骨架与真实内容结构一致，切换不跳动。
  </p>
</template>
