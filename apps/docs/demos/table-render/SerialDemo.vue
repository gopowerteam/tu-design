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
    {
      key: "continuous",
      title: "跨页连续",
      width: 110,
      // 第 4 参为页内上下文；跨页连续序号按 (pageIndex - 1) * pageSize + pageRowIndex 计算
      render: (r) =>
        r.render((_record, _index, _column, context) =>
          context ? (context.pageIndex - 1) * context.pageSize + context.pageRowIndex + 1 : "",
        ),
    },
    { key: "name", title: "名称" },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      页内序号：翻页/排序后从 base 重新计数；“跨页连续”列通过渲染上下文计算。
    </p>
  </div>
</template>
