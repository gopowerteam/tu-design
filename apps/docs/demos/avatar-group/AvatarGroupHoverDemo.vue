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
      <TAvatarGroup :max="3" expand-on-hover>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground">max=3 + 悬停展开，鼠标悬停试试</span>
    </div>
    <div class="flex flex-wrap items-center gap-8">
      <TAvatarGroup :max="3" expand-on-hover>
        <TAvatar v-for="(src, i) in srcs" :key="i" :src="src" :alt="`成员 ${i + 1}`" />
        <template #rest="{ rest }"
          ><span class="text-xs font-semibold">…{{ rest }}</span></template
        >
      </TAvatarGroup>
      <span class="text-xs text-muted-foreground"
        >rest 插槽自定义尾巴（如省略号风格），同样支持悬停展开</span
      >
    </div>
  </div>
</template>
