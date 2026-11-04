<script setup lang="ts">
import { defineForm, defineTable } from "@tu-design/vue";

interface Order {
  id: number;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "closed";
}

const ALL: Order[] = Array.from({ length: 137 }, (_, i) => ({
  id: 1000 + i,
  customer: `客户${i + 1}`,
  amount: 100 + ((i * 37) % 900),
  status: (["paid", "pending", "closed"] as const)[i % 3]!,
}));

// 表单值经 definition.search 进入引擎：onLoad 的 form 参数自动携带，无需手动桥接
const search = defineForm<{ keyword: string }>({
  items: [{ key: "keyword", title: "关键词", default: "" }],
});

function query(params: {
  form: Record<string, unknown>;
  page: { pageIndex: number; pageSize: number };
  sort?: { key: string; direction: "asc" | "desc" };
  update: (data: Order[], total?: number) => void;
}) {
  const { form, page, sort, update } = params;
  const term = String(form.keyword ?? "").trim();

  let rows = term
    ? ALL.filter((row) => row.customer.includes(term) || String(row.id).includes(term))
    : ALL;

  if (sort) {
    const key = sort.key as keyof Order;
    const order = sort.direction === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => (a[key] < b[key] ? -order : a[key] > b[key] ? order : 0));
  }

  const start = (page.pageIndex - 1) * page.pageSize;
  setTimeout(() => {
    // 竞态守卫在 TableRender 内部：慢响应不会覆盖更新的结果
    update(rows.slice(start, start + page.pageSize), rows.length);
  }, 300);
}

const table = defineTable<Order>({
  columns: [
    { key: "id", title: "订单号", width: 110 },
    { key: "customer", title: "客户", sortable: true },
    {
      key: "amount",
      title: "金额",
      align: "right",
      sortable: true,
      formatter: (row) => `¥${row.amount.toFixed(2)}`,
    },
    { key: "status", title: "状态" },
  ],
  search,
  onLoad: query,
});

// 查询/重置链路（R30）：submit() 返回校验是否通过；reload(true) 归位第 1 页重载
async function onSearch() {
  if (await table.search?.submit()) table.reload(true);
}

function onReset() {
  table.search?.resetToDefaults();
  table.reload(true);
}
</script>

<template>
  <div class="flex h-96 gap-3">
    <!-- 左列：搜索面板固定宽度；FormRender 窄容器 + 小 minWidth 自然单列 -->
    <aside class="w-52 shrink-0 space-y-3 rounded-lg border p-3">
      <TFormRender v-if="table.search" :definition="table.search" :min-width="200" />
      <TButton class="w-full" @click="onSearch">查 询</TButton>
      <TButton variant="outline" class="w-full" @click="onReset">重 置</TButton>
    </aside>

    <!-- 右列：表格撑满剩余空间，分页条贴底（简形：共 N 条 + 图标翻页） -->
    <div class="flex min-w-0 flex-1 flex-col gap-3">
      <TTableRender
        class="flex-1"
        :definition="table"
        row-key="id"
        :show-search="false"
        :show-pagination="false"
      />
      <TTablePagination :definition="table" :show-size-select="false" nav-mode="icon" />
    </div>
  </div>
</template>
