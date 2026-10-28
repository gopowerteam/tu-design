<template>
  <div class="flex flex-col items-center gap-3">
    <TDialog title="编辑个人资料" description="保存后立即生效，其他人将看到你的新资料。">
      <template #trigger>
        <TButton>编辑资料</TButton>
      </template>
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
      <template #footer="{ close }">
        <TButton variant="ghost" @click="close">取消</TButton>
        <TButton @click="close">保存更改</TButton>
      </template>
    </TDialog>
    <p class="text-xs text-muted-foreground">
      默认插槽即内容区，可放任意表单；#footer 右侧放主操作，移动端自动纵向堆叠。
    </p>
  </div>
</template>
