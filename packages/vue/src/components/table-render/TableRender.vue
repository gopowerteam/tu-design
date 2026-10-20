<script setup lang="ts">
import type { PropType, VNodeChild } from "vue";
import { columnRenders } from "./column-renders";
import { computed, isVNode, watch } from "vue";
import { Checkbox } from "@/components/checkbox";
import { Skeleton } from "@/components/skeleton";
import TablePagination from "./TablePagination.vue";
import type {
  DataRecord,
  SortableOptions,
  TableColumnOptions,
  TableLoadParams,
  TableRenderDefinition,
  TableSelectionOptions,
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
  /** 行选择（仅拆分式生效；聚合式请在 defineTable 配置）："radio" | "checkbox" | 对象 */
  rowSelection: {
    type: [String, Object] as PropType<"radio" | "checkbox" | TableSelectionOptions>,
    default: undefined,
  },
});

const emit = defineEmits<{
  "update:page-index": [pageIndex: number];
  "update:page-size": [pageSize: number];
  "sort-change": [sort: SortableOptions | undefined];
  "row-click": [record: DataRecord, index: number, event: MouseEvent];
  "selection-change": [rows: DataRecord[]];
  "update:selected-keys": [keys: Array<string | number>];
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
if (props.definition && props.rowSelection && import.meta.env.DEV) {
  console.warn(
    "[tu-design] <TableRender> 聚合式下 rowSelection 请在 defineTable 配置，组件 prop 已忽略。",
  );
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
    rowKey: props.rowKey,
    rowSelection: props.rowSelection,
  });
// 拆分式已传 rowKey；聚合式由组件回填（S1：选择引擎依赖 rowKey 就绪）
instance.setRowKey(props.rowKey);

const columns = computed(() => instance.columns);
const rows = computed(() => instance.table.getRowModel().rows);
/** 内部加载态 ∪ 外部受控加载态（R14） */
const loading = computed(() => props.loading === true || instance.loading.value);
const showPagination = computed(() => Math.ceil(instance.page.total / instance.page.pageSize) > 1);

// ---- 行选择（S 系列） -------------------------------------------------------
const selection = computed(() => instance.selection);
const selectedKeys = instance.selectedKeys;
const hasSelection = computed(() => selection.value.enabled);
/** 总列数 = 业务列 + 选择列（空态 colspan 与骨架行，S8） */
const columnCount = computed(() => columns.value.length + (hasSelection.value ? 1 : 0));

/** 表头全选三态（S10）：本页可选行与选中集求交派生（TanStack getter 追踪不稳，自算） */
const selectableKeys = computed(() =>
  rows.value.filter((row) => row.getCanSelect()).map((row) => rowKeyOf(row.original, row.index)),
);
const headerChecked = computed(
  () =>
    hasSelection.value &&
    selection.value.type === "checkbox" &&
    selectableKeys.value.length > 0 &&
    selectableKeys.value.every((key) => selectedKeys.value.has(key)),
);
const headerIndeterminate = computed(
  () =>
    hasSelection.value &&
    !headerChecked.value &&
    selectableKeys.value.some((key) => selectedKeys.value.has(key)),
);

function onHeaderSelect(checked: boolean) {
  instance.table.toggleAllPageRowsSelected(checked);
}

/** 行选择控件切换；radio 不可取消由引擎 S4 守卫，不选中态点击传 checked=true */
function onRowSelect(line: { key: string }, checked: boolean) {
  instance.toggleRowSelected(line.key, checked);
}

// 选中集变化 → 对外事件（S7）：排序/翻页不改变选中集，故不会误发
watch(instance.selectedKeys, (keys) => {
  emit("selection-change", [...selection.value.value]);
  emit("update:selected-keys", [...keys]);
});

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
    /** 行级可选过滤（S5）：selectable 谓词交由引擎 enableRowSelection 判定 */
    canSelect: row.getCanSelect(),
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
  selection: instance.selection,
  selectedKeys: instance.selectedKeys,
  setSelection: instance.setSelection,
  clearSelection: instance.clearSelection,
});
</script>

<template>
  <div class="w-full">
    <table class="w-full caption-bottom text-sm">
      <thead class="[&_tr]:border-b">
        <tr>
          <!-- 选择列：checkbox 型表头为本页全选三态（S3/S10）；radio 型占位 -->
          <th
            v-if="hasSelection"
            scope="col"
            class="h-10 w-12 px-2 align-middle font-medium text-muted-foreground"
            :style="{ width: `${selection.width}px` }"
          >
            <Checkbox
              v-if="selection.type === 'checkbox'"
              :checked="headerIndeterminate ? 'indeterminate' : headerChecked"
              :aria-label="'全选本页'"
              @update:checked="onHeaderSelect"
            />
          </th>
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
        <!-- 加载态：固定 5 行骨架（R14）；选择列一并占位（S8） -->
        <template v-if="loading">
          <tr v-for="row in SKELETON_ROWS" :key="row" data-skeleton>
            <td v-if="hasSelection" class="p-2 align-middle">
              <Skeleton class="size-4" />
            </td>
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
            <!-- 选择单元格：阻断冒泡避免触发行 row-click（S5）；radio 为原生控件 -->
            <td v-if="hasSelection" class="w-12 p-2 align-middle" @click.stop>
              <input
                v-if="selection.type === 'radio'"
                type="radio"
                class="accent-primary size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                :checked="selectedKeys.has(line.key)"
                :disabled="!line.canSelect"
                :aria-label="`选择第 ${line.index + 1} 行`"
                @click="onRowSelect(line, !selectedKeys.has(line.key))"
              />
              <Checkbox
                v-else
                :checked="selectedKeys.has(line.key)"
                :disabled="!line.canSelect"
                :aria-label="`选择第 ${line.index + 1} 行`"
                @update:checked="(checked: boolean) => onRowSelect(line, checked)"
              />
            </td>
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
            <td :colspan="columnCount" class="p-8 text-center text-muted-foreground">
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
