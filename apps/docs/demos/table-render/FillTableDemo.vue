<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Task {
  id: number;
  name: string;
  owner: string;
  status: "进行中" | "已完成" | "已阻塞";
  updatedAt: string;
}

const STATUS: Task["status"][] = ["进行中", "已完成", "已阻塞"];

const TASKS: Task[] = Array.from({ length: 23 }, (_, i) => ({
  id: i + 1,
  name: `任务 ${i + 1}`,
  owner: `成员 ${(i % 5) + 1}`,
  status: STATUS[i % 3]!,
  updatedAt: `2026-11-${String((i % 20) + 1).padStart(2, "0")}`,
}));

const table = defineTable<Task>({
  data: TASKS,
  pageSize: 100,
  columns: [
    { key: "name", title: "任务", width: 200 },
    { key: "owner", title: "负责人", width: 120 },
    { key: "status", title: "状态", width: 100 },
    { key: "updatedAt", title: "更新日期", width: 140, align: "right" },
  ],
});
</script>

<template>
  <div class="w-full space-y-3">
    <!-- 父链需有确定高度：demo 以 h-96 自保证（文档站外层不给高度） -->
    <div class="flex h-96 flex-col">
      <div class="min-h-0 flex-1">
        <TTableRender :definition="table" row-key="id" fill-height />
      </div>
    </div>
    <p class="text-muted-foreground text-xs">
      表格填满 <code>h-96</code> 容器并内部滚动，表头 sticky 钉住；
      行分隔线画在单元格上，填充（分离边框）模式下同样渲染。
    </p>
  </div>
</template>
