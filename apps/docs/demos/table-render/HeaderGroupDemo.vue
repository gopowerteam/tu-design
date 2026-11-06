<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Metric {
  id: number;
  region: string;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  remark: string;
  ops: string;
}

const ROWS: Metric[] = Array.from({ length: 8 }, (_, i) => ({
  id: 700 + i,
  region: ["华东", "华南", "华北", "西南"][i % 4]!,
  q1: 1200 + i * 130,
  q2: 1350 + i * 155,
  q3: 1420 + i * 170,
  q4: 1560 + i * 190,
  remark: `第 ${i + 1} 季度需复核渠道返点与结算口径，避免跨期确认。`,
  ops: "编辑",
}));

// 表头分组（多级表头，R34）：分组节点只提供 title，能力全部下沉到叶子列；
// 固定列、排序、列显隐与扁平列完全一致（叶子口径不变）。
const table = defineTable<Metric>({
  data: ROWS,
  columns: [
    { key: "region", title: "区域", width: 100, fixed: "left", sortable: true },
    {
      title: "上半年",
      children: [
        { key: "q1", title: "Q1", width: 90, sortable: true },
        { key: "q2", title: "Q2", width: 90, sortable: true },
      ],
    },
    {
      title: "下半年",
      children: [
        { key: "q3", title: "Q3", width: 90 },
        { key: "q4", title: "Q4", width: 90 },
      ],
    },
    { key: "remark", title: "备注", width: 260, ellipsis: true },
    { key: "ops", title: "操作", width: 100, fixed: "right" },
  ],
});
</script>

<template>
  <!-- 外层限宽制造横向滚动，验证分组表头与固定列共存 -->
  <div class="max-w-3xl">
    <TTableRender :definition="table" row-key="id" />
  </div>
</template>
