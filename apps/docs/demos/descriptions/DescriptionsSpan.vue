<script setup lang="ts">
import type { DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "应用名称", content: "订单中心", span: 2 },
  { label: "环境", content: "生产" },
  { label: "部署区域", content: "华东 1（杭州）", span: 2 },
  { label: "版本", content: "v3.8.2" },
  // 末行仅 1 列：自动拉伸补满整行
  { label: "描述", content: "承接下单、支付回调与订单状态流转。" },
];
</script>

<template>
  <div class="w-full max-w-2xl">
    <TDescriptions title="应用信息" bordered :column="3" :items="items" />
  </div>
</template>
