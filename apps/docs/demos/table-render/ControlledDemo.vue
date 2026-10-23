<script setup lang="ts">
import { ref } from "vue";
import type { SortableOptions } from "@tu-design/vue";
import { defineTable } from "@tu-design/vue";

interface User {
  id: number;
  name: string;
  age: number;
}

const ALL: User[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 18 + ((i * 7) % 50),
}));

// 受控状态：外部控件直接改 ref，表格经受控 watch 同步（内部交互经事件回写 ref，形成 v-model 闭环）
const pageIndex = ref(1);
const pageSize = ref(10);
const sort = ref<SortableOptions | undefined>(undefined);

const table = defineTable<User>({
  data: ALL, // 静态模式即可演示受控；服务端模式同样适用
  pageIndex,
  pageSize,
  sort,
  columns: [
    { key: "id", title: "ID", width: 100 },
    { key: "name", title: "姓名", sortable: true },
    { key: "age", title: "年龄", align: "right", sortable: true },
  ],
});

// 内部交互（分页条/表头点击）→ 事件 → 回写 ref
function onPageIndexChange(v: number) {
  pageIndex.value = v;
}
function onPageSizeChange(v: number) {
  pageSize.value = v;
}
function onSortChange(v: SortableOptions | undefined) {
  sort.value = v;
}

const MAX_PAGE = 10;

function toggleSort() {
  sort.value =
    sort.value?.key === "age" && sort.value.direction === "asc"
      ? { key: "age", direction: "desc" }
      : { key: "age", direction: "asc" };
}
</script>

<template>
  <div class="w-full space-y-3">
    <div class="flex flex-wrap items-center gap-2">
      <TButton variant="outline" size="sm" @click="pageIndex = 1">回到第 1 页</TButton>
      <TButton
        variant="outline"
        size="sm"
        @click="pageIndex = pageIndex >= MAX_PAGE ? 1 : pageIndex + 1"
      >
        外部翻页（当前第 {{ pageIndex }} 页）
      </TButton>
      <TButton variant="outline" size="sm" @click="toggleSort">
        外部排序：年龄{{ sort?.key === "age" && sort.direction === "asc" ? " ↓" : " ↑" }}
      </TButton>
      <span class="text-muted-foreground text-xs">pageSize：{{ pageSize }}</span>
    </div>

    <TTableRender
      :definition="table"
      row-key="id"
      :page-index="pageIndex"
      @update:page-index="onPageIndexChange"
      :page-size="pageSize"
      @update:page-size="onPageSizeChange"
      :sort="sort"
      @sort-change="onSortChange"
    />
  </div>
</template>
