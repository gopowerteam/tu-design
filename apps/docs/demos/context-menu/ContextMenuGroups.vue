<script setup lang="ts">
import type { MenuItemOption } from "@/components/dropdown-menu";

const items: MenuItemOption[] = [
  {
    type: "group",
    label: "文件",
    children: [
      { type: "item", value: "open", label: "打开" },
      { type: "item", value: "rename", label: "重命名" },
    ],
  },
  { type: "separator" },
  {
    type: "group",
    label: "视图",
    children: [
      { type: "item", value: "refresh", label: "刷新" },
      { type: "item", value: "fullscreen", label: "全屏", disabled: true },
    ],
  },
];
</script>

<template>
  <div class="flex justify-center py-24">
    <TContextMenu :items="items" class="w-48">
      <TButton variant="outline">分组菜单（右键）</TButton>
    </TContextMenu>
  </div>
</template>
