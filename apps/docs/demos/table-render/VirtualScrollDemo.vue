<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface LogEntry {
  id: number;
  seq: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
  time: string;
}

const LEVELS = ["info", "warn", "error"] as const;

// 10_000 行静态数据：虚拟化后仅当前视口行进入 DOM
const ROWS: LogEntry[] = Array.from({ length: 10_000 }, (_, i) => ({
  id: i + 1,
  seq: `LOG-${String(i + 1).padStart(6, "0")}`,
  level: LEVELS[i % 3]!,
  source: ["gateway", "auth", "billing", "scheduler"][i % 4]!,
  message: `请求 #${9000 + i} 处理完成，耗时 ${(i % 97) + 3}ms，命中本地缓存`,
  time: `2026-10-22 ${String(Math.floor(i / 600) % 24).padStart(2, "0")}:${String(
    Math.floor(i / 10) % 60,
  ).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}`,
}));

const table = defineTable<LogEntry>({
  data: ROWS,
  pageSize: 10_000, // 单页承载全部数据，滚动在页内虚拟化
  virtual: true,
  height: 400,
  rowSelection: "checkbox",
  columns: [
    { key: "seq", title: "序号", width: 120, fixed: "left" },
    {
      key: "level",
      title: "级别",
      width: 90,
      render: (r) =>
        r.dict({
          info: "信息",
          warn: { label: "警告", variant: "outline" },
          error: { label: "错误", variant: "destructive" },
        }),
    },
    { key: "source", title: "来源", width: 110 },
    { key: "message", title: "消息", ellipsis: true },
    { key: "time", title: "时间", width: 160 },
  ],
});
</script>

<template>
  <div class="w-full space-y-3">
    <p class="text-muted-foreground text-xs">
      10 000 行静态数据（pageSize 10000，容器高 400px）：表体按视口窗口渲染，
      滚动流畅、行选择与固定列照常工作。
    </p>
    <TTableRender :definition="table" row-key="id" />
  </div>
</template>
