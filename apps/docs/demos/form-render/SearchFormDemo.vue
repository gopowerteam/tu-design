<template>
  <div class="w-full">
    <TFormRender :definition="search" searchable :min-width="280" />
    <p v-if="lastQuery" class="text-muted-foreground mt-3 text-sm">
      最近一次查询条件：<code>{{ lastQuery }}</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import * as v from "valibot";
import { ref } from "vue";
import { defineForm } from "@tu-design/vue";

interface OrderQuery {
  keyword: string;
  status: string | null;
  range: [string, string] | null;
}

const lastQuery = ref("");

const search = defineForm<OrderQuery>({
  items: [
    {
      key: "keyword",
      title: "关键词",
      default: "",
      render: (r) => r.input({ placeholder: "订单号 / 客户" }),
    },
    {
      key: "status",
      title: "状态",
      default: null,
      // 联动显隐：仅当有关键词时出现
      visible: (q) => q.keyword !== "",
      render: (r) => r.select({ items: ["待付款", "已付款", "已发货"], placeholder: "全部" }),
    },
    {
      key: "range",
      title: "下单日期",
      default: null,
      span: "full",
      render: (r) => r.dateRangePicker(),
    },
  ],
  schema: v.object({
    keyword: v.string(),
    status: v.nullable(v.string()),
    range: v.nullable(v.tuple([v.string(), v.string()])),
  }),
  onSubmit: ({ value }) => {
    lastQuery.value = JSON.stringify(value);
  },
});
</script>
