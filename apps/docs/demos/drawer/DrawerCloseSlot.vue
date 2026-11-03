<template>
  <div class="flex justify-center gap-3">
    <TDrawer title="筛选条件" description="右上角为内置 X 图标。">
      <template #trigger>
        <TButton variant="outline">默认关闭图标</TButton>
      </template>
      <p class="text-sm text-muted-foreground">默认插槽的抽屉正文。</p>
    </TDrawer>
    <TDrawer title="筛选条件" description="#close 替换关闭按钮内容，关闭行为不变。">
      <template #trigger>
        <TButton variant="outline">自定义关闭图标</TButton>
      </template>
      <template #close>
        <span class="text-xs leading-none">✕ 关闭</span>
      </template>
      <p class="text-sm text-muted-foreground">默认插槽的抽屉正文。</p>
    </TDrawer>
  </div>
</template>
