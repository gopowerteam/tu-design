<template>
  <div class="flex flex-col gap-3">
    <TAlert title="无图标">
      <template #icon>&nbsp;</template>
      通过 <code class="text-xs">show-icon=false</code> 或覆盖 icon 插槽可去掉默认图标。
    </TAlert>
    <TAlert title="自定义关闭" closable variant="error">
      <template #close>
        <button class="rounded border border-destructive px-2 py-0.5 text-xs text-destructive">
          知道了
        </button>
      </template>
      close 插槽可替换默认关闭按钮。
    </TAlert>
  </div>
</template>
