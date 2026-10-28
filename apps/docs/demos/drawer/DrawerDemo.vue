<template>
  <div class="flex flex-col items-center gap-3">
    <TDrawer title="筛选条件" description="按需组合以下条件，结果实时生效。">
      <template #trigger>
        <TButton variant="outline">打开抽屉</TButton>
      </template>
      <p class="text-sm text-muted-foreground">
        这是抽屉的正文内容区，可以放表单、列表或任何自定义内容。
      </p>
      <template #footer="{ close }">
        <TButton variant="outline" @click="close">取消</TButton>
        <TButton @click="close">应用</TButton>
      </template>
    </TDrawer>
  </div>
</template>
