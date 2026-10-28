<template>
  <div class="flex flex-col gap-3">
    <TAlert variant="success">
      <template #icon>
        <span aria-hidden="true" class="text-lg leading-none">🎉</span>
      </template>
      <template #title>发布成功</template>
      自定义图标插槽 + 富文本内容：<strong class="text-success">v0.3.0</strong> 已上线。
    </TAlert>
    <TAlert variant="info" title="快捷键提示">
      按 <kbd class="rounded border bg-background px-1.5 py-0.5 text-xs">Ctrl</kbd> +
      <kbd class="rounded border bg-background px-1.5 py-0.5 text-xs">K</kbd> 打开命令面板。
    </TAlert>
  </div>
</template>
