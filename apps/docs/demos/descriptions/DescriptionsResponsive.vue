<script setup lang="ts">
import type { DescriptionsColumn, DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "地域", content: "华东 1（杭州）" },
  { label: "可用区", content: "可用区 B" },
  { label: "实例规格", content: "4 核 8 GiB" },
  { label: "镜像", content: "Ubuntu 24.04 LTS" },
  { label: "系统盘", content: "ESSD 100 GiB" },
  { label: "网络", content: "专有网络" },
];

const column: DescriptionsColumn = { base: 1, sm: 2, lg: 3 };
</script>

<template>
  <div class="w-full max-w-2xl">
    <TDescriptions title="实例信息（缩放浏览器窗口查看列数变化）" :column="column" :items="items" />
  </div>
</template>
