<template>
  <div class="grid w-full max-w-md grid-cols-2 gap-6">
    <div class="space-y-2">
      <p class="text-xs font-medium">圆形</p>
      <div class="flex items-center gap-3">
        <TSkeleton class="size-10 rounded-full" />
        <TSkeleton class="size-8 rounded-full" />
        <TSkeleton class="size-6 rounded-full" />
      </div>
    </div>
    <div class="space-y-2">
      <p class="text-xs font-medium">方形</p>
      <div class="flex items-center gap-3">
        <TSkeleton class="size-10 rounded-lg" />
        <TSkeleton class="size-8 rounded-lg" />
        <TSkeleton class="size-6 rounded-lg" />
      </div>
    </div>
    <div class="space-y-2">
      <p class="text-xs font-medium">文本行</p>
      <div class="space-y-2">
        <TSkeleton class="h-4 w-full" />
        <TSkeleton class="h-4 w-2/3" />
        <TSkeleton class="h-4 w-1/3" />
      </div>
    </div>
    <div class="space-y-2">
      <p class="text-xs font-medium">全宽块</p>
      <TSkeleton class="h-16 w-full" />
    </div>
  </div>
  <p class="text-xs text-muted-foreground">
    形状与尺寸完全由 class 决定：rounded-full 圆形、rounded-lg 方块、比例宽度模拟文本行。
  </p>
</template>
