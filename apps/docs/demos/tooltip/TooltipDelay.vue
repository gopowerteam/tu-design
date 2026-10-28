<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TTooltip :delay-duration="0" content="delay-duration=0，悬停立即出现">
      <TButton variant="outline" size="sm">立即显示</TButton>
    </TTooltip>

    <TTooltip :delay-duration="800" content="delay-duration=800，悬停片刻才出现">
      <TButton variant="outline" size="sm">延迟 800ms</TButton>
    </TTooltip>
  </div>
</template>
