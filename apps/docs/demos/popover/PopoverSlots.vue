<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TPopover match-trigger-width content-class="w-auto p-0">
      <TButton variant="outline" size="sm" class="w-64">等宽面板 + header/footer 插槽</TButton>
      <template #header>
        <p class="border-b px-4 py-2 text-sm font-medium">面板标题</p>
      </template>
      <template #content>
        <p class="px-4 py-2 text-sm">面板宽度与触发元素一致（match-trigger-width）。</p>
      </template>
      <template #footer>
        <p class="border-t px-4 py-2 text-xs text-muted-foreground">底部说明区</p>
      </template>
    </TPopover>
  </div>
</template>
