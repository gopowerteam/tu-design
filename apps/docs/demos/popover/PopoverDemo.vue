<template>
  <div class="flex flex-col items-center gap-3">
    <TPopover>
      <TPopoverTrigger as-child>
        <TButton variant="outline">点击打开气泡</TButton>
      </TPopoverTrigger>
      <TPopoverContent>
        <div class="text-sm font-medium">气泡面板</div>
        <p class="mt-1 text-sm text-muted-foreground">
          默认宽度 w-72，点击面板外或按 Escape 关闭；宽度可通过 class 覆盖。
        </p>
      </TPopoverContent>
    </TPopover>
    <p class="text-xs text-muted-foreground">TPopoverContent 可放任意内容，默认宽 w-72。</p>
  </div>
</template>
