<template>
  <div class="flex flex-wrap items-center justify-center gap-6">
    <TTooltip>
      <TTooltipTrigger as-child>
        <TButton variant="outline">悬停查看</TButton>
      </TTooltipTrigger>
      <TTooltipContent>这是一个文字提示气泡</TTooltipContent>
    </TTooltip>

    <TTooltip :delay-duration="0">
      <TTooltipTrigger as-child>
        <a href="#" class="text-sm text-primary underline underline-offset-4">带提示的链接</a>
      </TTooltipTrigger>
      <TTooltipContent class="max-w-48">点击前先看说明，避免误操作。</TTooltipContent>
    </TTooltip>
  </div>
</template>
