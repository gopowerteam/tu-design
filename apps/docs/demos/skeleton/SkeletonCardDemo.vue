<template>
  <div class="max-w-sm space-y-3 rounded-xl border p-4">
    <div class="flex items-center gap-3">
      <TSkeleton class="size-10 rounded-full" />
      <div class="flex-1 space-y-2">
        <TSkeleton class="h-4 w-1/3" />
        <TSkeleton class="h-3 w-1/4" />
      </div>
    </div>
    <TSkeleton class="h-36 w-full rounded-lg" />
    <div class="space-y-2">
      <TSkeleton class="h-4 w-full" />
      <TSkeleton class="h-4 w-2/3" />
    </div>
  </div>
  <p class="text-xs text-muted-foreground">
    卡片骨架：头部（头像 + 两行）、媒体区、正文两行，结构与真实卡片一一对应。
  </p>
</template>
