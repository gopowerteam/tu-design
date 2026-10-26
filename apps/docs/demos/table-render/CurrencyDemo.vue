<script setup lang="ts">
import { defineTable } from "@tu-design/vue";

interface Price {
  id: number;
  item: string;
  cny: number | string;
  usd: number;
  dirty: number | string;
}

const PRICES: Price[] = [
  { id: 1, item: "键盘", cny: 1234.5, usd: 169.99, dirty: 1234.5 },
  { id: 2, item: "显示器", cny: "880", usd: 121, dirty: Number.NaN }, // NaN 原样显示
  { id: 3, item: "鼠标垫", cny: 0, usd: 0, dirty: "一万" }, // 非数字原样显示
];

const table = defineTable<Price>({
  data: PRICES,
  pageSize: 10,
  columns: [
    { key: "item", title: "商品" },
    { key: "cny", title: "默认 CNY", align: "right", render: (r) => r.currency() },
    { key: "usd", title: "USD / en-US", align: "right", render: (r) => r.currency("USD", "en-US") },
    { key: "dirty", title: "脏数据", align: "right", render: (r) => r.currency() },
  ],
});
</script>

<template>
  <div class="w-full">
    <TTableRender :definition="table" row-key="id" />
    <p class="text-muted-foreground mt-2 text-xs">
      数字字符串 <code>"880"</code> 会被 <code>Number()</code> 转换；
      <code>NaN</code> 与非数字字符串原样显示。
    </p>
  </div>
</template>
