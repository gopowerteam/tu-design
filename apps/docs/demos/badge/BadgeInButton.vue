<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-wrap items-center justify-center gap-3">
      <TButton variant="outline">
        收件箱
        <TBadge variant="secondary" class="ml-1">12</TBadge>
      </TButton>
      <TButton>
        通知
        <TBadge class="ml-1 rounded-full px-1.5">3</TBadge>
      </TButton>
    </div>
    <p class="text-xs text-muted-foreground">嵌在按钮内作为计数徽章，可用 class 调整圆角与间距</p>
  </div>
</template>
