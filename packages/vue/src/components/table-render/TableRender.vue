<script setup lang="ts">
import type { PropType, VNodeChild } from "vue";
import { columnRenders } from "./column-renders";
import { computed, isVNode } from "vue";
import { Skeleton } from "@/components/skeleton";
import TablePagination from "./TablePagination.vue";
import type {
  DataRecord,
  SortableOptions,
  TableColumnOptions,
  TableLoadParams,
  TableRenderDefinition,
} from "./types";
import { useTableRender } from "./useTableRender";

// boolean flags 用运行时声明 + default: undefined 禁用 Vue 的 Boolean casting
// （casting 会让未传的 prop 变 false；Checkbox/Dialog/FormRender 同款约定）
const props = defineProps({
  /** 聚合式（推荐）：defineTable 返回的定义对象 */
  definition: { type: Object as PropType<TableRenderDefinition<any>> },
  /** 数据主键（记录缺字段时以行索引兜底） */
  rowKey: { type: String, required: true },
  /** 拆分式：与 definition 二选一，definition 优先 */
  columns: { type: Array as PropType<TableColumnOptions[]> },
  onLoad: {
    type: Function as PropType<(params: TableLoadParams) => void | Promise<unknown>>,
  },
  data: { type: Array as PropType<DataRecord[]> },
  autoLoad: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  pageSize: { type: Number },
  pageSizeOpts: { type: Array as PropType<number[]> },
  loading: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  emptyText: { type: String },
});

const emit = defineEmits<{
  "update:page-index": [pageIndex: number];
  "update:page-size": [pageSize: number];
  "sort-change": [sort: SortableOptions | undefined];
  "row-click": [record: DataRecord, index: number, event: MouseEvent];
}>();

defineSlots<{ empty?: () => VNodeChild }>();

/** 加载态骨架行数（R14） */
const SKELETON_ROWS = [1, 2, 3, 4, 5];

/** 内置渲染器单例：render 工厂按列求值时复用（工厂本身轻量，仅为整洁） */
const RENDERS = columnRenders();

// 聚合式直接复用 defineTable 建好的内核；拆分式在本组件 setup 内建内核
// （TanStack useVueTable 只能在 setup 调用，故不能放进条件分支深处）
if (props.definition && props.columns && import.meta.env.DEV) {
  console.warn("[tu-design] <TableRender> definition 与 columns 同时传入，已按 definition 渲染。");
}
const instance =
  props.definition ??
  useTableRender({
    columns: props.columns ?? [],
    onLoad: props.onLoad,
    data: () => props.data,
    autoLoad: props.autoLoad,
    pageSize: props.pageSize,
    pageSizeOpts: props.pageSizeOpts,
  });

const columns = computed(() => instance.columns);
const rows = computed(() => instance.table.getRowModel().rows);
/** 内部加载态 ∪ 外部受控加载态（R14） */
const loading = computed(() => props.loading === true || instance.loading.value);
const showPagination = computed(() => Math.ceil(instance.page.total / instance.page.pageSize) > 1);

/** 行 → 单元格值矩阵：render > formatter > record[key]（R17） */
const body = computed(() => {
  // 渲染器工厂按列求值一次（而非每单元格），避免用户工厂内的重分配被放大
  const renderFns = new Map(
    columns.value.filter((c) => c.render).map((c) => [c, c.render!(RENDERS)]),
  );
  return rows.value.map((row) => ({
    key: rowKeyOf(row.original, row.index),
    index: row.index,
    record: row.original,
    cells: columns.value.map((column): VNodeChild => {
      const render = renderFns.get(column);
      if (render) return render(row.original, row.index, column);
      if (column.formatter) return column.formatter(row.original) as VNodeChild;
      return String(row.original[column.key] ?? "");
    }),
  }));
});

let missingRowKeyWarned = false;

/** 行主键：rowKey 字段缺失时以行索引兜底（R3） */
function rowKeyOf(record: DataRecord, index: number): string {
  const value = record[props.rowKey];
  if (value === undefined || value === null) {
    if (!missingRowKeyWarned && import.meta.env.DEV) {
      missingRowKeyWarned = true;
      console.warn(
        `[tu-design] <TableRender> 部分记录缺少 rowKey 字段 "${props.rowKey}"，已退化为按行索引标识。`,
      );
    }
    return `index-${index}`;
  }
  return String(value);
}

/** aria-sort 仅在该列当前被排序时标注（R16） */
function ariaSort(column: TableColumnOptions): "ascending" | "descending" | undefined {
  if (instance.sort.value?.key !== column.key) return undefined;
  return instance.sort.value.direction === "asc" ? "ascending" : "descending";
}

function sortMark(column: TableColumnOptions): string {
  const direction = instance.sort.value?.key === column.key ? instance.sort.value.direction : "";
  return direction === "asc" ? "↑" : direction === "desc" ? "↓" : "";
}

function cellText(line: { cells: VNodeChild[] }, index: number): string {
  const value = line.cells[index];
  return isVNode(value) ? "" : String(value ?? "");
}

function onSort(key: string) {
  instance.toggleSort(key);
  emit("sort-change", instance.sort.value);
}

function onPageIndex(pageIndex: number) {
  instance.setPageIndex(pageIndex);
  emit("update:page-index", pageIndex);
}

function onPageSize(pageSize: number) {
  instance.setPageSize(pageSize);
  emit("update:page-size", pageSize);
}

function onRowClick(record: DataRecord, index: number, event: MouseEvent) {
  emit("row-click", record, index, event);
}

defineExpose({
  table: instance.table,
  page: instance.page,
  sort: instance.sort,
  loading: instance.loading,
  reload: instance.reload,
  toggleSort: onSort,
  setPageIndex: onPageIndex,
  setPageSize: onPageSize,
});
</script>

<template>
  <div class="w-full">
    <table class="w-full caption-bottom text-sm">
      <thead class="[&_tr]:border-b">
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            scope="col"
            class="h-10 px-2 align-middle font-medium text-muted-foreground"
            :style="{ width: column.width, textAlign: column.align }"
            :aria-sort="ariaSort(column)"
          >
            <button
              v-if="column.sortable"
              type="button"
              class="inline-flex items-center gap-1 hover:text-foreground"
              @click="onSort(column.key)"
            >
              {{ column.title }}
              <span aria-hidden="true" class="text-xs">{{ sortMark(column) }}</span>
            </button>
            <template v-else>{{ column.title }}</template>
          </th>
        </tr>
      </thead>

      <tbody class="[&_tr:last-child]:border-0">
        <!-- 加载态：固定 5 行骨架（R14） -->
        <template v-if="loading">
          <tr v-for="row in SKELETON_ROWS" :key="row" data-skeleton>
            <td
              v-for="column in columns"
              :key="column.key"
              class="p-2 align-middle"
              :style="{ textAlign: column.align }"
            >
              <Skeleton class="h-4 w-full" />
            </td>
          </tr>
        </template>

        <template v-else>
          <tr
            v-for="line in body"
            :key="line.key"
            class="border-b transition-colors hover:bg-muted/50"
            @click="onRowClick(line.record, line.index, $event)"
          >
            <td
              v-for="(value, index) in line.cells"
              :key="columns[index].key"
              class="p-2 align-middle"
              :class="{ truncate: columns[index].ellipsis }"
              :title="columns[index].ellipsis ? cellText(line, index) : undefined"
              :style="{ textAlign: columns[index].align }"
            >
              <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
              <component :is="value" v-if="isVNode(value)" />
              <template v-else>{{ value }}</template>
            </td>
          </tr>

          <tr v-if="body.length === 0" data-empty>
            <td :colspan="columns.length" class="p-8 text-center text-muted-foreground">
              <slot name="empty">{{ emptyText ?? "暂无数据" }}</slot>
            </td>
          </tr>
        </template>
      </tbody>
    </table>

    <TablePagination
      v-if="showPagination"
      :page-index="instance.page.pageIndex"
      :page-size="instance.page.pageSize"
      :page-size-opts="instance.page.pageSizeOpts"
      :total="instance.page.total"
      @update:page-index="onPageIndex"
      @update:page-size="onPageSize"
    />
  </div>
</template>
