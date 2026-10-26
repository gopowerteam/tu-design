<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

interface Invoice {
  id: number;
  customer: string;
  status: "paid" | "pending" | "overdue";
  createdAt: Date;
  amount: number;
  locked: boolean;
}

const INVOICES: Invoice[] = [
  {
    id: 1001,
    customer: "华东贸易",
    status: "paid",
    createdAt: new Date(2026, 0, 15, 9, 5, 3),
    amount: 1234.5,
    locked: false,
  },
  {
    id: 1002,
    customer: "南洋实业",
    status: "pending",
    createdAt: new Date(2026, 1, 3),
    amount: 880,
    locked: false,
  },
  {
    id: 1003,
    customer: "北斗科技",
    status: "overdue",
    createdAt: new Date(2025, 11, 28),
    amount: 42,
    locked: true,
  },
];

const picked = ref<Invoice>();

const table = defineTable<Invoice>({
  data: INVOICES,
  pageSize: 10,
  columns: [
    { key: "seq", title: "#", width: 48, render: (r) => r.serial() },
    { key: "customer", title: "客户" },
    {
      key: "status",
      title: "状态",
      render: (r) =>
        r.dict({
          paid: { label: "已付款", variant: "default" },
          pending: { label: "待付款", variant: "secondary" },
          overdue: { label: "已逾期", variant: "destructive" },
        }),
    },
    { key: "createdAt", title: "开票日期", render: (r) => r.date("yyyy/MM/dd HH:mm") },
    { key: "amount", title: "金额", align: "right", render: (r) => r.currency("CNY") },
    {
      key: "ops",
      title: "操作",
      render: (r) =>
        r.button([
          { text: "查看", onClick: (row) => (picked.value = row) },
          { text: (row) => (row.locked ? "已锁定" : "作废"), disabled: (row) => row.locked },
        ]),
    },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" @row-click="picked = $event[0]" />
    <p v-if="picked" class="text-muted-foreground mt-3 text-sm">
      点击了「查看」：<code>{{ picked.customer }}</code
      >（{{ picked.id }}）
    </p>
    <p class="text-muted-foreground mt-1 text-xs">
      第 3 行演示 <code>disabled</code> 逐行禁用与函数化 <code>text</code>；
      注意点击操作列按钮也会触发行点击（冒泡）。
    </p>
  </div>
</template>
