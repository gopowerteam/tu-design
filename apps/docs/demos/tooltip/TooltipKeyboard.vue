<template>
  <div class="flex flex-col items-center gap-3">
    <TTooltip content="键盘聚焦同样会触发提示，Escape 关闭">
      <TButton variant="outline">用 Tab 键聚焦我</TButton>
    </TTooltip>
    <p class="text-sm text-muted-foreground">按 Tab 将焦点移到按钮上即可触发。</p>
  </div>
</template>
