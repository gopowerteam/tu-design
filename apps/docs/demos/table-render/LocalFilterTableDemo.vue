<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import * as v from "valibot";
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

const STATUS_MAP: Record<string, Order["status"]> = {
  已付款: "paid",
  待付款: "pending",
  已关闭: "closed",
};

// 全量数据：本地分页的前提是数据已在前端
const allRows = ref<Order[]>([]);
const loading = ref(false);

/** 模拟一次性拉全量；真实项目换成 axios / fetch
 * @returns 订单全量列表
 */
async function fetchAll(): Promise<Order[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return Array.from({ length: 137 }, (_, i) => ({
    id: 1000 + i,
    customer: `客户${i + 1}`,
    amount: 100 + ((i * 37) % 900),
    status: (["paid", "pending", "closed"] as const)[i % 3]!,
  }));
}

// 外置筛选表单：本地模式不要传给 defineTable.search（仅服务端模式生效）
const filter = ref<OrderQuery>({ keyword: "", status: null });

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
  schema: v.object({ keyword: v.string(), status: v.nullable(v.string()) }),
  searchable: true,
});

// 过滤后的数据源：仍交给引擎做本地排序与分页
const rows = computed(() => {
  const keyword = filter.value.keyword.trim();
  const status = filter.value.status ? STATUS_MAP[filter.value.status] : undefined;

  return allRows.value.filter((row) => {
    const hitKeyword =
      !keyword || row.customer.includes(keyword) || String(row.id).includes(keyword);
    const hitStatus = !status || row.status === status;
    return hitKeyword && hitStatus;
  });
});

const table = defineTable<Order>({
  data: rows,
  pageSize: 10,
  pageSizeOpts: [10, 20, 50],
  columns: [
    { key: "seq", title: "#", width: 56, align: "center", render: (r) => r.serial() },
    { key: "id", title: "订单号", width: 110 },
    { key: "customer", title: "客户", sortable: true, ellipsis: true },
    {
      key: "amount",
      title: "金额",
      align: "right",
      sortable: true,
      defaultSort: "desc",
      render: (r) => r.currency(),
    },
    {
      key: "status",
      title: "状态",
      width: 110,
      render: (r) =>
        r.dict({
          paid: { label: "已付款", variant: "default" },
          pending: { label: "待付款", variant: "secondary" },
          closed: { label: "已关闭", variant: "destructive" },
        }),
    },
  ],
});

function onSearch() {
  // FormRender 已校验通过；读取当前表单值
  filter.value = { ...(search.form.state.values as OrderQuery) };
  // 默认 autoResetPageIndex 会归位第 1 页；显式调用兼容关闭自动归位的配置
  table.setPageIndex(1);
}

function onReset() {
  filter.value = { keyword: "", status: null };
  table.setPageIndex(1);
}

onMounted(async () => {
  loading.value = true;
  try {
    allRows.value = await fetchAll();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="w-full space-y-3">
    <div class="rounded-lg border p-3">
      <TFormRender :definition="search" :min-width="220" @search="onSearch" @reset="onReset" />
    </div>

    <TTableRender :definition="table" row-key="id" :loading="loading" empty-text="没有匹配的订单" />

    <p class="text-muted-foreground text-xs">
      共 {{ rows.length }} 条 · 本地分页（排序 / 筛选 / 翻页均不发请求）
    </p>
  </div>
</template>
