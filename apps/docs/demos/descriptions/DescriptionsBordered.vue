<script setup lang="ts">
import type { DescriptionsColumn, DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "订单编号", content: "TD-20261123-0042" },
  { label: "是否已开通企业级数据备份与跨区域容灾服务", content: "是" },
  { label: "计费方式", content: "按量计费" },
  { label: "备注", content: "测试环境，数据每日清理；生产环境请提交工单申请。" },
];

const column: DescriptionsColumn = { base: 1, sm: 3 };
</script>

<template>
  <div class="w-full max-w-2xl">
    <TDescriptions title="订单详情" extra="只读" bordered :column="column" :items="items" />
  </div>
</template>
