<script setup lang="ts">
import { ref } from "vue";
import type { MenuItemOption } from "@tu-design/vue";

const items: MenuItemOption[] = [
  { type: "item", value: "edit", label: "编辑" },
  { type: "item", value: "duplicate", label: "复制" },
  { type: "separator" },
  { type: "item", value: "delete", label: "删除" },
];

const selected = ref("");

function onSelect(details: { value: string }) {
  selected.value = details.value;
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-24">
    <TDropdownMenu :items="items" @select="onSelect">
      <TButton variant="outline">打开菜单</TButton>
    </TDropdownMenu>
    <p class="text-xs text-muted-foreground">最后选中：{{ selected || "（尚未选择）" }}</p>
  </div>
</template>
