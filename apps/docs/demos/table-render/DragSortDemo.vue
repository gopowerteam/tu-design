<script setup lang="ts">
import { defineTable, type TableDragSortPayload } from "@tu-design/vue";
import { ref } from "vue";

interface App {
  id: number;
  name: string;
  weight: number;
}

const data = ref<App[]>(
  Array.from({ length: 8 }, (_, i) => ({
    id: i + 1,
    name: `应用${i + 1}`,
    weight: (i + 1) * 10,
  })),
);

const lastSort = ref("");

const table = defineTable<App>({
  data,
  rowKey: "id",
  draggable: true,
  columns: [
    { key: "name", title: "应用名称" },
    { key: "weight", title: "排序权重", align: "right" },
  ],
});

/**
 * 静态模式：引擎已先行重排内部数据；调用方应回写自身数据源（否则后续 data 变更会覆盖拖拽结果）
 * @param payload - drag-sort 载荷：from/to 页内索引、record 被拖行、rows 当前页新行序
 */
function onDragSort(payload: TableDragSortPayload<App>) {
  // 典型业务：按新行序重算 weight 后批量提交；此处演示本地回写
  data.value = payload.rows.map((row, index) => ({ ...row, weight: (index + 1) * 10 }));
  lastSort.value = `「${payload.record.name}」从第 ${payload.from + 1} 行移到第 ${payload.to + 1} 行`;
}
</script>

<template>
  <div class="w-full space-y-3">
    <TTableRender :definition="table" row-key="id" @drag-sort="onDragSort" />
    <p class="text-muted-foreground text-xs">
      拖动首列把手调整行序（仅当前页内）；落位后按新行序重算 weight。
      <template v-if="lastSort">最近一次：{{ lastSort }}。</template>
      列排序激活时把手置灰，取消排序后恢复。
    </p>
  </div>
</template>
