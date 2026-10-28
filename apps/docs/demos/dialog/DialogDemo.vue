<template>
  <div class="flex flex-col items-center gap-3">
    <TDialog title="归档项目" description="归档后项目将变为只读，你可以随时在归档列表中恢复。">
      <template #trigger>
        <TButton variant="outline">打开对话框</TButton>
      </template>
      <p class="text-sm text-muted-foreground">这里是默认插槽的弹层内容区。</p>
      <template #footer="{ close }">
        <TButton variant="ghost" @click="close">取消</TButton>
        <TButton @click="close">确认归档</TButton>
      </template>
    </TDialog>
    <p class="text-xs text-muted-foreground">
      #trigger 放触发元素，title / description 传文案；Escape / 遮罩点击 / 右上角关闭按钮 / #footer
      的 close 均可关闭。
    </p>
  </div>
</template>
