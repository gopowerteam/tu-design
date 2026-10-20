<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Task {
  id: number;
  title: string;
  status: "done" | "running" | "failed" | "unknown";
  level: "high" | "low";
}

const TASKS: Task[] = [
  { id: 1, title: "数据迁移", status: "done", level: "high" },
  { id: 2, title: "索引重建", status: "running", level: "low" },
  { id: 3, title: "备份校验", status: "failed", level: "high" },
  { id: 4, title: "清理临时表", status: "unknown", level: "low" }, // 未命中 → 原样显示
];

const table = defineTable<Task>({
  data: TASKS,
  pageSize: 10,
  columns: [
    { key: "title", title: "任务" },
    {
      // 条目级 variant：每行状态不同徽标
      key: "status",
      title: "状态（条目级 variant）",
      render: (r) =>
        r.dict({
          done: { label: "完成", variant: "default" },
          running: { label: "进行中", variant: "secondary" },
          failed: { label: "失败", variant: "destructive" },
        }),
    },
    {
      // options.badge 整列简写：true = Badge 默认变体
      key: "level",
      title: "级别（整列 badge）",
      render: (r) => r.dict({ high: "高", low: "低" }, { badge: true }),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      第 4 行状态值为 <code>unknown</code>（未配置映射）→ 原样显示原始文本。
    </p>
  </div>
</template>
