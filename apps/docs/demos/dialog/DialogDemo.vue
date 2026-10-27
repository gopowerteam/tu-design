<template>
  <div class="flex flex-col items-center gap-3">
    <TDialog>
      <TDialogTrigger as-child>
        <TButton variant="outline">打开对话框</TButton>
      </TDialogTrigger>
      <TDialogContent>
        <TDialogHeader>
          <TDialogTitle>归档项目</TDialogTitle>
          <TDialogDescription
            >归档后项目将变为只读，你可以随时在归档列表中恢复。</TDialogDescription
          >
        </TDialogHeader>
        <TDialogFooter>
          <TDialogClose as-child>
            <TButton variant="ghost">取消</TButton>
          </TDialogClose>
          <TDialogClose as-child>
            <TButton>确认归档</TButton>
          </TDialogClose>
        </TDialogFooter>
      </TDialogContent>
    </TDialog>
    <p class="text-xs text-muted-foreground">
      Trigger 打开，Escape / 遮罩点击 / 右上角关闭按钮 / TDialogClose 均可关闭。
    </p>
  </div>
</template>
