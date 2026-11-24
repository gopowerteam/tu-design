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

// 受控状态：defineTable 传 ref 即受控；此处同时把值作为组件 prop 传入，演示标准 v-model 闭环
// （聚合式只传 defineTable ref、不传 prop 也可以受控；钳制/归位修正仍会经 update 事件回写）
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
