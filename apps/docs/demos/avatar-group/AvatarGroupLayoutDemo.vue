<script setup lang="ts">
const srcs = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=5",
];
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup size="lg">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">size="lg" 下发给全部子头像</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup size="lg">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
        <TAvatar size="sm" src="https://i.pravatar.cc/96?img=25" alt="显式 sm 的成员" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">末位子头像显式 size="sm"，覆盖组级下发</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup vertical>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">vertical 垂直排列</span>
    </div>
  </div>
</template>
