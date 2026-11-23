<script setup lang="ts">
import type { DescriptionsColumn, DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "集群", content: "prod-core" },
  { label: "节点数", content: 12 },
  { label: "状态", content: "运行中" },
  { label: "控制台", content: "打开控制台" },
];

const column: DescriptionsColumn = { base: 1, sm: 2 };
</script>

<template>
  <div class="w-full max-w-2xl">
    <TDescriptions title="集群详情" bordered label-placement="left" :column="column" :items="items">
      <template #extra>
        <TButton variant="outline" size="sm">管理</TButton>
      </template>
      <template #label="{ item, index }">
        {{ item.label }}
        <span v-if="index === 0" class="ml-1 text-xs text-muted-foreground/60">ID</span>
      </template>
      <template #content="{ item }">
        <TBadge v-if="item.label === '状态'" variant="secondary">{{ item.content }}</TBadge>
        <a
          v-else-if="item.label === '控制台'"
          href="#"
          class="text-primary underline-offset-4 hover:underline"
        >
          {{ item.content }}
        </a>
        <span v-else>{{ item.content }}</span>
      </template>
    </TDescriptions>
  </div>
</template>
