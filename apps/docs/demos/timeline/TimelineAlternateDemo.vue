<script setup lang="ts">
import type { TimelineItemData } from "@tu-design/vue";

const items: TimelineItemData[] = [
  {
    timestamp: "2026-10-12 09:00",
    title: "提交申请",
    content: "张三提交出差报销申请，金额 ¥2,380。",
  },
  {
    timestamp: "2026-10-12 14:30",
    title: "直属上级审批",
    content: "李四审核单据与行程，审批通过。",
    dotColor: "success",
  },
  {
    timestamp: "2026-10-13 10:15",
    title: "财务复核",
    content: "发票信息缺失，退回补充材料。",
    dotColor: "warning",
  },
  {
    timestamp: "2026-10-14 11:20",
    title: "重新提交",
    content: "张三补传增值税发票后重新提交。",
  },
  {
    timestamp: "2026-10-14 16:45",
    title: "打款完成",
    content: "财务完成打款，流程结束。",
    dotColor: "success",
  },
];
</script>

<template>
  <div class="flex justify-center">
    <TTimeline :items="items" mode="alternate" class="w-[36rem] max-w-full" />
  </div>
</template>
