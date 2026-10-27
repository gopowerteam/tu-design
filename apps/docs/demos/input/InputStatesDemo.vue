<template>
  <div class="grid items-start gap-8 sm:grid-cols-3">
    <div class="flex flex-col items-center gap-3">
      <TInput disabled placeholder="禁用状态" class="w-full" />
      <p class="text-muted-foreground text-center text-xs">disabled，不可聚焦不可输入</p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TInput readonly model-value="只读内容" class="w-full" />
      <p class="text-muted-foreground text-center text-xs">readonly，可聚焦可复制</p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TInput invalid placeholder="校验失败示例" class="w-full" />
      <p class="text-muted-foreground text-center text-xs">invalid，aria-invalid + destructive</p>
    </div>
  </div>
</template>
