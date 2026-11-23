<script setup lang="ts">
import type { DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "项目名称", content: "客户数据平台 v3" },
  { label: "负责人", content: "张伟" },
  { label: "状态", content: "进行中" },
  { label: "创建时间", content: "2026-10-12 09:30" },
  { label: "截止时间", content: "2026-12-31 18:00" },
  { label: "可见范围", content: "研发部、产品部" },
];
</script>

<template>
  <div class="w-full max-w-2xl">
    <TDescriptions title="项目信息" extra="更新于 5 分钟前" :items="items" />
  </div>
</template>
