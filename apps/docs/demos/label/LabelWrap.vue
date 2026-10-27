<template>
  <div class="flex w-full max-w-sm flex-col gap-4">
    <div class="space-y-1">
      <p class="text-sm font-medium leading-none">插槽包裹控件</p>
      <p class="text-xs text-muted-foreground">label 包裹控件时无需 for/id，点击文字同样聚焦。</p>
    </div>
    <label class="flex items-center gap-2 text-sm font-medium leading-none">
      <t-checkbox id="demo-terms" />
      我已阅读并同意服务条款
    </label>
    <t-label class="flex flex-col gap-2">
      昵称
      <t-input placeholder="不超过 20 个字符" />
    </t-label>
  </div>
</template>
