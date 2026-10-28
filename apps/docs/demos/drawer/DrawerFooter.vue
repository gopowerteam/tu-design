<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TDrawer
      title="删除项目"
      description="此操作不可撤销，请确认后继续。"
      placement="bottom"
      size="sm"
    >
      <template #trigger>
        <TButton variant="destructive">删除项目</TButton>
      </template>
      <p class="text-sm text-muted-foreground">项目「Q3 营销素材」及其 12 个子任务将被永久删除。</p>
      <template #footer="{ close }">
        <TButton variant="outline" @click="close">取消</TButton>
        <TButton variant="destructive" @click="close">确认删除</TButton>
      </template>
    </TDrawer>

    <TDrawer title="宽幅抽屉" size="lg">
      <template #trigger>
        <TButton variant="outline">lg 宽度</TButton>
      </template>
      <p class="text-sm text-muted-foreground">侧向抽屉 lg 档位宽度为 40rem。</p>
    </TDrawer>
  </div>
</template>
