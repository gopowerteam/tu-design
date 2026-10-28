<script setup lang="ts">
import type { MenuItemOption } from "@tu-design/vue";

const items: MenuItemOption[] = [
  { type: "label", label: "操作" },
  { type: "item", value: "edit", label: "编辑" },
  { type: "item", value: "duplicate", label: "复制" },
  { type: "separator" },
  { type: "item", value: "archive", label: "归档（禁用）", disabled: true },
  { type: "separator" },
  {
    type: "item",
    value: "delete",
    label: "删除",
    class: "text-destructive data-[highlighted]:text-destructive",
  },
];

function onSelect(details: { value: string }) {
  // eslint-disable-next-line no-console
  console.log("selected:", details.value);
}
</script>

<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu :items="items" content-class="w-48" @select="onSelect">
      <TButton>打开菜单</TButton>
    </TDropdownMenu>
  </div>
</template>
