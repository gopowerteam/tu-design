<script setup lang="ts">
const srcs = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=5",
  "https://i.pravatar.cc/96?img=25",
  "https://i.pravatar.cc/96?img=8",
];
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="6">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">max=6，未超出，不折叠</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="4">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">max=4，共 6 人，折叠为 +2 尾巴</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="2">
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">max=2，折叠为 +4 尾巴</span>
    </div>
  </div>
</template>
