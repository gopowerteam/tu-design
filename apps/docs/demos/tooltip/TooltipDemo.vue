<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <TTooltip content="这是一个文字提示气泡">
      <TButton variant="outline">悬停查看</TButton>
    </TTooltip>

    <TTooltip :delay-duration="0" content-class="max-w-48" content="点击前先看说明，避免误操作。">
      <a href="#" class="text-sm text-primary underline underline-offset-4">带提示的链接</a>
    </TTooltip>
  </div>
</template>
