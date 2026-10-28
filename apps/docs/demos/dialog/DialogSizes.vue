<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TDialog
      v-for="size in sizes"
      :key="size.label"
      :title="size.title"
      :description="size.description"
      :content-class="size.cls"
    >
      <template #trigger>
        <TButton variant="outline">{{ size.label }}</TButton>
      </template>
      <p class="text-sm text-muted-foreground">
        面板宽度由 content-class 覆盖（默认 <code>sm:max-w-lg</code>）。
      </p>
      <template #footer="{ close }">
        <TButton variant="ghost" @click="close">关闭</TButton>
      </template>
    </TDialog>
  </div>
</template>

<script setup lang="ts">
const sizes = [
  {
    cls: "sm:max-w-sm",
    label: "紧凑（sm）",
    title: "紧凑对话框",
    description: "适合确认操作、简短提示类内容。",
  },
  {
    cls: "",
    label: "默认（lg）",
    title: "默认对话框",
    description: "默认宽度 sm:max-w-lg，适合表单等常规内容。",
  },
  {
    cls: "sm:max-w-xl",
    label: "加宽（xl）",
    title: "加宽对话框",
    description: "适合列表、表格等更宽的内容。",
  },
];
</script>
