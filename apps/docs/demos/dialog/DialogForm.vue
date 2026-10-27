<template>
  <div class="flex flex-col items-center gap-3">
    <TDialog>
      <TDialogTrigger as-child>
        <TButton>编辑资料</TButton>
      </TDialogTrigger>
      <TDialogContent>
        <TDialogHeader>
          <TDialogTitle>编辑个人资料</TDialogTitle>
          <TDialogDescription>保存后立即生效，其他人将看到你的新资料。</TDialogDescription>
        </TDialogHeader>
        <div class="grid gap-4 py-1">
          <div class="grid items-center gap-2">
            <TLabel for="dialog-form-name">名称</TLabel>
            <TInput id="dialog-form-name" default-value="zhuchentong" />
          </div>
          <div class="grid items-center gap-2">
            <TLabel for="dialog-form-email">邮箱</TLabel>
            <TInput id="dialog-form-email" type="email" default-value="me@example.com" />
          </div>
        </div>
        <TDialogFooter>
          <TDialogClose as-child>
            <TButton variant="ghost">取消</TButton>
          </TDialogClose>
          <TDialogClose as-child>
            <TButton>保存更改</TButton>
          </TDialogClose>
        </TDialogFooter>
      </TDialogContent>
    </TDialog>
    <p class="text-xs text-muted-foreground">
      内容区可放任意表单；Footer 右侧放主操作，移动端自动纵向堆叠。
    </p>
  </div>
</template>
