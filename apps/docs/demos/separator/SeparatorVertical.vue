<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">垂直方向</p>
      <p class="text-xs text-muted-foreground"><code>w-px h-full</code>，需要父容器有确定高度。</p>
    </div>
    <div class="flex h-16 items-center gap-4">
      <span class="text-sm">左</span>
      <TSeparator orientation="vertical" />
      <span class="text-sm">右</span>
    </div>
    <div class="flex h-16 items-center gap-4">
      <span class="text-sm flex-1">首页</span>
      <TSeparator orientation="vertical" />
      <span class="text-sm flex-1 text-center">文档</span>
      <TSeparator orientation="vertical" />
      <span class="text-sm flex-1 text-right">关于</span>
    </div>
  </div>
</template>
