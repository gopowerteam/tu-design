<script setup lang="ts">
import { ref } from "vue";

const srcs = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=5",
  "https://i.pravatar.cc/96?img=25",
  "https://i.pravatar.cc/96?img=8",
];

const status = ref("加载中…");
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="4">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>

      <TAvatarGroup :max="3" expand-on-hover bordered>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>

      <TAvatarGroup vertical size="sm">
        <TAvatar v-for="(src, i) in srcs.slice(0, 3)" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
    </div>

    <div class="flex items-center gap-4">
      <TAvatar
        src="https://i.pravatar.cc/96?img=999"
        fallback-src="https://i.pravatar.cc/96?img=12"
        @load="status = '加载完成'"
        @error="status = '备用图加载失败'"
      >
        <template #placeholder>
          <span class="text-xs">…</span>
        </template>
      </TAvatar>
      <span class="text-sm text-muted-foreground">{{ status }}</span>
    </div>
  </div>
</template>
