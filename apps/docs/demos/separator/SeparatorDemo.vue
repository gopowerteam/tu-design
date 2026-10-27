<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">基础用法</p>
      <p class="text-xs text-muted-foreground">
        水平方向，<code>h-px w-full</code> 撑满父容器宽度。
      </p>
    </div>
    <TSeparator />
    <p class="text-sm text-muted-foreground">
      上方是一条水平分隔线，常用于段落、表单分组之间的视觉切分。
    </p>
    <TSeparator />
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span>页脚左侧</span>
      <span>页脚右侧</span>
    </div>
  </div>
</template>
