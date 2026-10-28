<script setup lang="ts">
import { ref } from "vue";
import type { MenuItemOption } from "@/components/dropdown-menu";

const items: MenuItemOption[] = [
  { type: "item", value: "edit", label: "编辑" },
  { type: "item", value: "share", label: "分享" },
  { type: "separator" },
  { type: "item", value: "delete", label: "删除", class: "text-destructive" },
];

const tip = ref("");

function onSelect(details: { value: string }) {
  tip.value = details.value === "delete" ? "已触发删除（危险项标红）" : `已选中 ${details.value}`;
}
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-24">
    <TContextMenu :items="items" class="w-48" @select="onSelect">
      <TButton variant="outline">危险项演示（右键）</TButton>
    </TContextMenu>
    <p class="text-xs text-muted-foreground">{{ tip || "删除项以 text-destructive 标红" }}</p>
  </div>
</template>
