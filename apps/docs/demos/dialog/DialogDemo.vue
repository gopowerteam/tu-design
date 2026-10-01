<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TDialog>
      <TDialogTrigger as-child>
        <TButton variant="outline">编辑资料</TButton>
      </TDialogTrigger>
      <TDialogContent>
        <TDialogHeader>
          <TDialogTitle>编辑个人资料</TDialogTitle>
          <TDialogDescription>保存后立即生效，其他人将看到你的新资料。</TDialogDescription>
        </TDialogHeader>
        <div class="grid gap-4 py-1">
          <div class="grid items-center gap-2">
            <TLabel for="demo-name">名称</TLabel>
            <TInput id="demo-name" default-value="zhuchentong" />
          </div>
          <div class="grid items-center gap-2">
            <TLabel for="demo-email">邮箱</TLabel>
            <TInput id="demo-email" type="email" default-value="me@example.com" />
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

    <TDialog>
      <TDialogTrigger as-child>
        <TButton variant="destructive">删除数据</TButton>
      </TDialogTrigger>
      <TDialogContent class="sm:max-w-sm">
        <TDialogHeader>
          <TDialogTitle>确认删除？</TDialogTitle>
          <TDialogDescription>此操作不可撤销，数据将被永久删除。</TDialogDescription>
        </TDialogHeader>
        <TDialogFooter>
          <TDialogClose as-child>
            <TButton variant="ghost">取消</TButton>
          </TDialogClose>
          <TDialogClose as-child>
            <TButton variant="destructive">确认删除</TButton>
          </TDialogClose>
        </TDialogFooter>
      </TDialogContent>
    </TDialog>
  </div>
</template>
