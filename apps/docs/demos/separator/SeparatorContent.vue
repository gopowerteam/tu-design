<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">文字夹层分隔线</p>
      <p class="text-xs text-muted-foreground">
        组合 flex 布局即可实现「或」式分隔，无需子组件支持。
      </p>
    </div>
    <div class="flex items-center gap-3">
      <TSeparator class="flex-1" />
      <span class="text-xs text-muted-foreground">或</span>
      <TSeparator class="flex-1" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">标题分隔</p>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >最近项目</span
      >
      <TSeparator class="flex-1" />
    </div>
  </div>
</template>
