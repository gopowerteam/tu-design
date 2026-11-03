<template>
  <div class="flex justify-center gap-3">
    <TDialog title="归档项目" description="右上角为内置 X 图标。">
      <template #trigger>
        <TButton variant="outline">默认关闭图标</TButton>
      </template>
    </TDialog>
    <TDialog title="归档项目" description="#close 替换关闭按钮内容，关闭行为不变。">
      <template #trigger>
        <TButton variant="outline">自定义关闭图标</TButton>
      </template>
      <template #close>
        <span class="text-xs leading-none">✕ 关闭</span>
      </template>
    </TDialog>
  </div>
</template>
