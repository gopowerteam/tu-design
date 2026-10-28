<script setup lang="ts">
import type { MenuItemOption } from "@tu-design/vue";

const items: MenuItemOption[] = [
  { type: "item", value: "edit", label: "编辑" },
  { type: "item", value: "share", label: "分享" },
  {
    type: "item",
    value: "delete",
    label: "删除",
    class: "text-destructive data-[highlighted]:text-destructive",
  },
];

const shortcuts: Record<string, string> = {
  edit: "⌘E",
  share: "⌘S",
  delete: "⌫",
};
</script>

<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu :items="items" content-class="w-48">
      <TButton variant="outline">快捷键菜单</TButton>
      <!-- #item 接管菜单项渲染：仍保留键盘导航与 select 行为 -->
      <template #item="{ item }">
        <span class="flex flex-1 items-center justify-between gap-4">
          {{ item.label }}
          <kbd class="text-xs text-muted-foreground">{{ shortcuts[item.value] }}</kbd>
        </span>
      </template>
    </TDropdownMenu>
  </div>
</template>
