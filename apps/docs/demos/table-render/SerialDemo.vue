<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Item {
  id: number;
  name: string;
}

const ITEMS: Item[] = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: `条目${i + 1}` }));

const table = defineTable<Item>({
  data: ITEMS,
  pageSize: 5,
  columns: [
    { key: "seq", title: "默认从 1 起", width: 110, render: (r) => r.serial() },
    { key: "seq0", title: "base=0（从 0 起）", width: 140, render: (r) => r.serial(0) },
    { key: "name", title: "名称" },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      页内序号：翻页后从 base 重新计数；不读取字段值，key 可为任意占位。
    </p>
  </div>
</template>
