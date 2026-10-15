<script setup lang="ts">
import { ref } from "vue";
import { defineTable } from "@tu-design/vue";

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

// 搜索条件放在表格之外（v1 的 onLoad 入参 form 恒为 {}，搜索联动属二期 FormRender 集成）
const keyword = ref("");

/** 模拟服务端：延迟返回 + 按关键词/分页/排序切片 */
function query(params: {
  page: { pageIndex: number; pageSize: number };
  sort?: { key: string; direction: "asc" | "desc" };
  update: (data: Order[], total?: number) => void;
}) {
  const { page, sort, update } = params;
  const term = keyword.value.trim();

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
  }, 400);
}

const table = defineTable<Order>({
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
  onLoad: query,
});

function search() {
  keyword.value = keyword.value.trim();
  table.reload(true); // 归位到第 1 页并重新取数
}
</script>

<template>
  <div class="w-full space-y-3">
    <div class="flex items-center gap-2">
      <TInput
        :model-value="keyword"
        class="w-56"
        placeholder="客户 / 订单号（模糊匹配）"
        @update:model-value="keyword = $event"
        @keyup.enter="search"
      />
      <TButton @click="search">查询</TButton>
      <TButton variant="ghost" @click="((keyword = ''), table.reload(true))"> 重置 </TButton>
    </div>

    <TTableRender :definition="table" row-key="id" empty-text="没有匹配的订单" />

    <p class="text-muted-foreground text-xs">
      服务端模式：分页与排序不做本地计算，每次状态变化都以新参数回调
      <code>onLoad</code>；<code>update</code> 的第二个参数
      <code>total</code> 缺省时沿用上一次的值。
    </p>
  </div>
</template>
