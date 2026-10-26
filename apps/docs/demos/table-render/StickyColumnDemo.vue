<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Flow {
  id: number;
  date: string;
  customer: string;
  product: string;
  channel: string;
  amount: number;
  status: "paid" | "pending" | "closed";
  remark: string;
}

const ROWS: Flow[] = Array.from({ length: 12 }, (_, i) => ({
  id: 900 + i,
  date: `2026-09-${String((i % 28) + 1).padStart(2, "0")}`,
  customer: `客户${i + 1}`,
  product: ["企业版授权", "增值服务包", "硬件网关", "技术支持"][i % 4]!,
  channel: ["直营", "渠道", "电商"][i % 3]!,
  amount: 1200 + i * 337,
  status: (["paid", "pending", "closed"] as const)[i % 3]!,
  remark: `含合同编号 HT-2026-${1000 + i}，需在交付后 15 个工作日内完成验收并归档。`,
}));

const table = defineTable<Flow>({
  data: ROWS, // 固定列是纯渲染层能力，静态模式即可演示
  rowSelection: "checkbox", // 选择列视作最左固定列参与偏移累计
  columns: [
    { key: "date", title: "日期", width: 110, fixed: "left" },
    { key: "customer", title: "客户", width: 140 },
    { key: "product", title: "商品", width: 160 },
    { key: "channel", title: "渠道", width: 100 },
    {
      key: "amount",
      title: "金额",
      width: 120,
      align: "right",
      formatter: (row) => `¥${row.amount.toLocaleString()}`,
    },
    {
      key: "status",
      title: "状态",
      width: 100,
      render: (r) =>
        r.dict({
          paid: "已付款",
          pending: { label: "待付款", variant: "outline" },
          closed: "已关闭",
        }),
    },
    { key: "remark", title: "备注", width: 280, ellipsis: true },
    {
      key: "ops",
      title: "操作",
      width: 130,
      fixed: "right",
      render: (r) => r.button([{ text: "详情" }, "编辑"]),
    },
  ],
});
</script>

<template>
  <div class="w-full space-y-3">
    <!-- 外层限宽制造横向滚动：日期列与操作列固定，选择列作为最左固定列参与累计 -->
    <div class="max-w-2xl">
      <TTableRender :definition="table" row-key="id" />
    </div>
    <p class="text-muted-foreground text-xs">
      横向滚动时固定列始终可见（sticky 偏移按列宽在渲染层推算）；fixed 列必须提供数字
      <code>width</code>，否则 DEV 警告并按普通列渲染。
    </p>
  </div>
</template>
