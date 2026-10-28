<template>
  <div class="flex flex-col items-center gap-3">
    <TPopover>
      <TButton variant="outline">点击打开气泡</TButton>
      <template #content>
        <div class="text-sm font-medium">气泡面板</div>
        <p class="mt-1 text-sm text-muted-foreground">
          默认宽度 w-72，点击面板外或按 Escape 关闭；宽度可通过 content-class 覆盖。
        </p>
      </template>
    </TPopover>
    <p class="text-xs text-muted-foreground">默认插槽是触发元素本体，面板内容放 #content 插槽。</p>
  </div>
</template>
