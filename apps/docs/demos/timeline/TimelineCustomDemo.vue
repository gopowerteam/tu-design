<script setup lang="ts">
import type { TimelineItemData } from "@tu-design/vue";

const items: TimelineItemData[] = [
  { timestamp: "2026-11-01 20:00", title: "发布窗口开启" },
  {
    timestamp: "2026-11-01 20:12",
    title: "构建与冒烟测试",
    content: "全量构建通过，冒烟测试 42/42。",
    dotColor: "success",
  },
  {
    timestamp: "2026-11-01 20:40",
    title: "灰度 10%",
    content: "错误率 0.02%，符合预期，继续放量。",
    dotColor: "success",
  },
  {
    timestamp: "2026-11-01 20:58",
    title: "监控告警",
    content: "P99 延迟抖动，人工确认后恢复。",
    dotColor: "destructive",
  },
  {
    timestamp: "2026-11-01 21:30",
    title: "全量发布",
    content: "配置已同步至全部节点。",
    dotColor: "success",
  },
];
</script>

<template>
  <div class="flex justify-center">
    <TTimeline :items="items" size="sm" class="w-80">
      <template #item="{ item, index }">
        <span class="text-xs leading-4 text-muted-foreground tabular-nums">
          {{ item.timestamp }}
        </span>
        <p class="text-xs leading-4 font-medium text-foreground">
          {{ item.title }}
          <span class="ml-1 font-normal text-muted-foreground">#{{ index + 1 }}</span>
        </p>
        <p v-if="item.content" class="mt-1 text-xs leading-relaxed text-muted-foreground">
          {{ item.content }}
        </p>
      </template>
    </TTimeline>
  </div>
</template>
