<script setup lang="ts">
const rows = [0, 1, 2, 3];
</script>

<template>
  <div class="w-full max-w-md divide-y">
    <div v-for="row in rows" :key="row" class="flex items-center gap-4 py-3">
      <TSkeleton class="size-10 shrink-0 rounded-full" />
      <div class="flex-1 space-y-2">
        <TSkeleton class="h-4 w-1/2" />
        <TSkeleton class="h-3 w-3/4" />
      </div>
    </div>
  </div>
  <p class="text-xs text-muted-foreground">
    列表骨架：v-for 重复同构条目，每行头像 + 两行文字，宽度错落避免呆板。
  </p>
</template>
