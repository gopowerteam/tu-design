<script setup lang="ts">
import { h } from "vue";
import { defineTable } from "@tu-design/vue";

interface Task {
  name: string;
  percent: number;
}

const TASKS: Task[] = [
  { name: "数据迁移", percent: 100 },
  { name: "索引重建", percent: 62 },
  { name: "备份校验", percent: 12 }, // 低于 30% 标红
];

function progressColumn(warnBelow = 30) {
  // r.render 是自定义渲染器逃逸口，与内置渲染器同一签名
  return (r: any) =>
    r.render((row: Task) =>
      h("div", { class: "flex items-center gap-2" }, [
        h(
          "div",
          { class: "h-1.5 w-24 overflow-hidden rounded-full bg-muted" },
          h("div", {
            class: [
              "h-full rounded-full",
              row.percent < warnBelow ? "bg-destructive" : "bg-primary",
            ],
            style: { width: `${row.percent}%` },
          }),
        ),
        h("span", { class: "text-xs tabular-nums" }, `${row.percent}%`),
      ]),
    );
}

const table = defineTable<Task>({
  data: TASKS,
  pageSize: 10,
  columns: [
    { key: "name", title: "任务" },
    { key: "percent", title: "进度（自定义渲染器）", render: progressColumn() },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      自定义工厂 <code>progressColumn()</code> 与内置渲染器同签名，可逐列混用（见
      <a class="text-primary" href="#r-dict-mapping-options-—-字典映射">dict</a> 演示）。
    </p>
  </div>
</template>
