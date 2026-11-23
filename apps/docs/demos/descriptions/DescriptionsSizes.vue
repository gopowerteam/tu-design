<script setup lang="ts">
import type { DescriptionsColumn, DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "主机名", content: "web-01" },
  { label: "IP", content: "10.0.12.34" },
  { label: "CPU", content: "4 vCPU" },
  { label: "内存", content: "8 GiB" },
];

const column: DescriptionsColumn = { base: 1, sm: 2 };
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-4">
    <TDescriptions title="size=sm" size="sm" bordered :column="column" :items="items" />
    <TDescriptions title="size=default（默认）" bordered :column="column" :items="items" />
    <TDescriptions title="size=lg" size="lg" bordered :column="column" :items="items" />
  </div>
</template>
