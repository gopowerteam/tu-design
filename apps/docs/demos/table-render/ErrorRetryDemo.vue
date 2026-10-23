<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Order {
  id: number;
  customer: string;
  amount: number;
}

const ALL: Order[] = Array.from({ length: 23 }, (_, i) => ({
  id: 1000 + i,
  customer: `客户${i + 1}`,
  amount: 100 + ((i * 37) % 900),
}));

/** 模拟不稳定服务端：前 2 次取数抛错，之后成功（体现错误占位与重试恢复） */
let callCount = 0;

const table = defineTable<Order>({
  columns: [
    { key: "id", title: "订单号", width: 120 },
    { key: "customer", title: "客户", ellipsis: true },
    {
      key: "amount",
      title: "金额",
      width: 140,
      align: "right",
      formatter: (row) => `¥${row.amount.toFixed(2)}`,
    },
  ],
  onLoad: async ({ page, update }) => {
    callCount += 1;
    if (callCount <= 2) {
      throw new Error(`第 ${callCount} 次取数失败（模拟网络抖动），请重试`);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
    const start = (page.pageIndex - 1) * page.pageSize;
    update(ALL.slice(start, start + page.pageSize), ALL.length);
  },
});
</script>

<template>
  <div class="w-full space-y-3">
    <!-- #error 插槽完全自定义占位（slot props { error, retry }）；删掉该插槽即用默认占位 -->
    <TTableRender :definition="table" row-key="id">
      <template #error="{ retry }">
        <div class="flex flex-col items-center gap-3">
          <p class="text-destructive">服务暂时不可用</p>
          <TButton variant="outline" size="sm" @click="retry">重新加载</TButton>
        </div>
      </template>
    </TTableRender>

    <p class="text-muted-foreground text-xs">
      onLoad 抛错（或 rejects）即进入错误态（默认占位 = 错误信息 + 重试按钮）， 重试触发
      <code>reload()</code>，新一轮 load 开始时清除错误； <code>load-error</code> 事件可同步上报。
    </p>
  </div>
</template>
