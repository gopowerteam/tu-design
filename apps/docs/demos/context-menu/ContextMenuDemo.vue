<script setup lang="ts">
import { ref } from "vue";
import type { MenuItemOption } from "@/components/dropdown-menu";

const items: MenuItemOption[] = [
  { type: "item", value: "copy", label: "复制" },
  { type: "item", value: "paste", label: "粘贴" },
  { type: "separator" },
  { type: "item", value: "reload", label: "重新加载" },
];

const selected = ref("");

function onSelect(details: { value: string }) {
  selected.value = details.value;
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-24">
    <TContextMenu :items="items" @select="onSelect">
      <TButton variant="outline">在这块区域右键</TButton>
    </TContextMenu>
    <p class="text-xs text-muted-foreground">最后选中：{{ selected || "（尚未选择）" }}</p>
  </div>
</template>
