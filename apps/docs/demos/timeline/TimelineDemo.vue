<script setup lang="ts">
import type { TimelineItemData } from "@tu-design/vue";

const items: TimelineItemData[] = [
  {
    timestamp: "2026-09-30 10:24",
    title: "v2.4.0 发布",
    content: "新增 Timeline 时间轴组件，数据驱动渲染竖向事件流。",
  },
  {
    timestamp: "2026-08-18 18:02",
    title: "v2.3.0 发布",
    content: "Toast 支持消息队列与滑动关闭。",
  },
  {
    timestamp: "2026-07-05 09:41",
    title: "v2.2.1 发布",
    content: "修复 DatePicker 边界日期选择问题。",
    dotColor: "warning",
  },
  {
    timestamp: "2026-06-01 14:00",
    title: "v2.2.0 发布",
    content: "主题系统迁移至 oklch 语义 tokens。",
  },
];
</script>

<template>
  <div class="flex justify-center">
    <TTimeline :items="items" class="w-80" />
  </div>
</template>
