<script setup lang="ts">
import {
  PaginationEllipsis as ArkPaginationEllipsis,
  PaginationItem as ArkPaginationItem,
  PaginationNextTrigger as ArkPaginationNextTrigger,
  PaginationPrevTrigger as ArkPaginationPrevTrigger,
  PaginationRoot as ArkPaginationRoot,
} from "@ark-ui/vue/pagination";
import { computed } from "vue";

const props = defineProps<{
  /** 1-based 当前页码 */
  pageIndex: number;
  pageSize: number;
  pageSizeOpts: readonly number[];
  total: number;
}>();

const emit = defineEmits<{
  "update:pageIndex": [pageIndex: number];
  "update:pageSize": [pageSize: number];
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

/** 页码窗口：首页/尾页 + 当前页 ±1，跳过段用省略号（D12） */
const pages = computed<(number | string)[]>(() => {
  const count = totalPages.value;
  const window = [...new Set([1, count, props.pageIndex - 1, props.pageIndex, props.pageIndex + 1])]
    .filter((page) => page >= 1 && page <= count)
    .sort((a, b) => a - b);

  const items: (number | string)[] = [];
  let previous = 0;
  for (const page of window) {
    if (previous && page - previous > 1) items.push("…");
    items.push(page);
    previous = page;
  }
  return items;
});
</script>

<template>
  <div class="flex w-full items-center justify-between gap-4 border-t p-2 text-sm">
    <div class="flex items-center gap-2 text-muted-foreground">
      <span>共 {{ total }} 条</span>
      <select
        class="h-8 rounded-md border bg-transparent px-2 text-sm"
        :value="pageSize"
        @change="emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-for="size in pageSizeOpts" :key="size" :value="size">{{ size }} 条/页</option>
      </select>
    </div>

    <!-- Root 渲染为裸 nav 且 Ellipsis 是块级 div，必须显式 flex 才不会断行 -->
    <ArkPaginationRoot
      class="flex items-center gap-1"
      :count="total"
      :page="pageIndex"
      :page-size="pageSize"
      :sibling-count="1"
      @page-change="emit('update:pageIndex', $event.page)"
    >
      <ArkPaginationPrevTrigger
        class="h-8 rounded-md border px-3 disabled:opacity-50"
        :disabled="pageIndex <= 1"
      >
        上一页
      </ArkPaginationPrevTrigger>

      <template v-for="(item, index) in pages" :key="item">
        <ArkPaginationEllipsis v-if="typeof item === 'string'" :index="index" />
        <ArkPaginationItem
          v-else
          type="page"
          class="h-8 min-w-8 rounded-md border px-2 data-[selected]:bg-primary data-[selected]:text-primary-foreground"
          :value="item"
        >
          {{ item }}
        </ArkPaginationItem>
      </template>

      <ArkPaginationNextTrigger
        class="h-8 rounded-md border px-3 disabled:opacity-50"
        :disabled="pageIndex >= totalPages"
      >
        下一页
      </ArkPaginationNextTrigger>
    </ArkPaginationRoot>
  </div>
</template>
