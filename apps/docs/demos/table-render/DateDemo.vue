<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Log {
  id: number;
  event: string;
  at: string;
  bad: string;
}

const LOGS: Log[] = [
  { id: 1, event: "部署", at: "2026-01-15T09:05:00", bad: "2026-01-15" },
  { id: 2, event: "回滚", at: 1768435200000, bad: "明天" }, // 时间戳 + 非法输入
];

const table = defineTable<Log>({
  data: LOGS,
  pageSize: 10,
  columns: [
    { key: "event", title: "事件" },
    { key: "at", title: "yyyy/MM/dd HH:mm", render: (r) => r.date("yyyy/MM/dd HH:mm") },
    { key: "at", title: "默认 yyyy-MM-dd", render: (r) => r.date() },
    {
      key: "bad",
      title: "非法输入原样显示",
      render: (r) => r.date("yyyy-MM-dd"),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      输入接受 <code>Date</code> / ISO 字符串 / <code>yyyy-MM-dd</code> / 毫秒时间戳；
      <code>"明天"</code> 无法解析 → 原样显示，不抛错。
    </p>
  </div>
</template>
