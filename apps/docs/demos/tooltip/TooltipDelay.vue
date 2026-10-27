<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TTooltip :delay-duration="0">
      <TTooltipTrigger as-child>
        <TButton variant="outline" size="sm">立即显示</TButton>
      </TTooltipTrigger>
      <TTooltipContent>delay-duration=0，悬停立即出现</TTooltipContent>
    </TTooltip>

    <TTooltip :delay-duration="800">
      <TTooltipTrigger as-child>
        <TButton variant="outline" size="sm">延迟 800ms</TButton>
      </TTooltipTrigger>
      <TTooltipContent>delay-duration=800，悬停片刻才出现</TTooltipContent>
    </TTooltip>
  </div>
</template>
