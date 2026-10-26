<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

interface Doc {
  id: number;
  name: string;
  locked: boolean;
}

const DOCS: Doc[] = [
  { id: 1, name: "需求文档", locked: false },
  { id: 2, name: "设计稿", locked: true },
  { id: 3, name: "会议纪要", locked: false },
];

const action = ref("");

const table = defineTable<Doc>({
  data: DOCS,
  pageSize: 10,
  columns: [
    { key: "name", title: "文档" },
    {
      key: "ops",
      title: "操作",
      render: (r) =>
        r.button([
          "查看", // 字符串简写，等价 { text: "查看" }
          { text: "编辑", onClick: (row) => (action.value = `编辑 ${row.name}`) },
          {
            text: (row) => (row.locked ? "已锁定" : "解锁"),
            disabled: (row) => row.locked, // 逐行禁用
          },
        ]),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-sm">
      最近操作：<code>{{ action || "（点击操作列按钮试试）" }}</code>
    </p>
    <p class="text-muted-foreground mt-1 text-xs">
      第 2 行演示 <code>disabled</code> 逐行禁用与函数化 <code>text</code>；onClick 收到
      <code>(record, index)</code>。
    </p>
  </div>
</template>
