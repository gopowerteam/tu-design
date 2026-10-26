<script setup lang="ts">
import * as v from "valibot";
import { ref } from "vue";
import { defineForm, defineTable } from "@tu-design/vue";

interface Order {
  id: number;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "closed";
}

interface OrderQuery {
  keyword: string;
  status: string | null;
}

const ALL: Order[] = Array.from({ length: 137 }, (_, i) => ({
  id: 1000 + i,
  customer: `客户${i + 1}`,
  amount: 100 + ((i * 37) % 900),
  status: (["paid", "pending", "closed"] as const)[i % 3]!,
}));

const STATUS_MAP: Record<string, Order["status"]> = {
  已付款: "paid",
  待付款: "pending",
  已关闭: "closed",
};

// 搜索表单：值随每次 onLoad 下发（params.form），重置回 items.default
const search = defineForm<OrderQuery>({
  items: [
    {
      key: "keyword",
      title: "关键词",
      default: "",
      render: (r) => r.input({ placeholder: "客户 / 订单号" }),
    },
    {
      key: "status",
      title: "状态",
      default: null,
      render: (r) => r.select({ items: ["已付款", "待付款", "已关闭"], placeholder: "全部" }),
    },
  ],
  schema: v.object({
    keyword: v.string(),
    status: v.nullable(v.string()),
  }),
});

const table = defineTable<Order>({
  search, // 传入即内置搜索区；仅服务端模式生效
  columns: [
    { key: "id", title: "订单号", width: 120 },
    { key: "customer", title: "客户", sortable: true, ellipsis: true },
    {
      key: "amount",
      title: "金额",
      align: "right",
      sortable: true,
      defaultSort: "desc",
      formatter: (row) => `¥${row.amount.toFixed(2)}`,
    },
    { key: "status", title: "状态" },
  ],
  onLoad: ({ form, page, sort, update }) => {
    const keyword = String(form.keyword ?? "").trim();
    const status = form.status == null ? "" : String(form.status);

    let rows = ALL;
    if (keyword) {
      rows = rows.filter(
        (row) => row.customer.includes(keyword) || String(row.id).includes(keyword),
      );
    }
    if (status) rows = rows.filter((row) => row.status === STATUS_MAP[status]);
    if (sort) {
      const key = sort.key as keyof Order;
      const order = sort.direction === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => (a[key] < b[key] ? -order : a[key] > b[key] ? order : 0));
    }

    const start = (page.pageIndex - 1) * page.pageSize;
    setTimeout(() => {
      update(rows.slice(start, start + page.pageSize), rows.length);
    }, 300);
  },
});

const lastQuery = ref("");

function onSearch(values: Record<string, unknown>) {
  lastQuery.value = `search → ${JSON.stringify(values)}`;
}

function onReset(values: Record<string, unknown>) {
  lastQuery.value = `reset → ${JSON.stringify(values)}`;
}
</script>

<template>
  <div class="w-full space-y-3">
    <!-- 搜索区由 TableRender 内置渲染：@search 归位第 1 页重载；@reset 已重置为 defaults 后重载 -->
    <TTableRender
      :definition="table"
      row-key="id"
      empty-text="没有匹配的订单"
      @search="onSearch"
      @reset="onReset"
    />

    <p v-if="lastQuery" class="text-muted-foreground text-xs">{{ lastQuery }}</p>
  </div>
</template>
