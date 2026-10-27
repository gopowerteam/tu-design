<script setup lang="ts">
const srcs = [
  "https://i.pravatar.cc/96?img=12",
  "https://i.pravatar.cc/96?img=32",
  "https://i.pravatar.cc/96?img=47",
  "https://i.pravatar.cc/96?img=5",
  "https://i.pravatar.cc/96?img=25",
];
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="4" bordered>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">bordered 描边，重叠处以背景色描边分隔</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup bordered>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">无 max 时全部展开，同样生效</span>
    </div>
  </div>
</template>
