<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">必填与禁用</p>
      <p class="text-xs text-muted-foreground">必填标记用追加 span 实现；禁用态降低文字强调。</p>
    </div>
    <div class="space-y-2">
      <t-label for="demo-name">
        项目名称
        <span class="text-destructive" aria-hidden="true">*</span>
      </t-label>
      <t-input id="demo-name" placeholder="必填项" />
    </div>
    <div class="space-y-2">
      <t-label for="demo-plan" class="text-muted-foreground">付费方案</t-label>
      <t-input id="demo-plan" disabled placeholder="不可修改" />
    </div>
  </div>
</template>
