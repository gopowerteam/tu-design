<script setup lang="ts">
import { ref } from "vue";

const keyword = ref("");
const searched = ref("");
const nickname = ref("");

function onSearch() {
  searched.value = keyword.value;
}
</script>

<template>
  <div class="w-full max-w-sm space-y-4">
    <div class="space-y-2">
      <TInput
        v-model="keyword"
        type="search"
        placeholder="搜索组件，回车触发"
        @keydown.enter="onSearch"
      />
      <p class="text-muted-foreground text-xs">
        回车搜索（原生事件透传）：{{ searched || "（尚未搜索）" }}
      </p>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="space-y-2">
        <TInput v-model="nickname" maxlength="10" placeholder="最多 10 个字符" />
        <p class="text-muted-foreground text-xs">maxlength + 计数：{{ nickname.length }}/10</p>
      </div>
      <div class="space-y-2">
        <TInput type="password" placeholder="原生掩码" autocomplete="new-password" />
        <p class="text-muted-foreground text-xs">type="password"（掩码由浏览器渲染）</p>
      </div>
    </div>
  </div>
</template>
