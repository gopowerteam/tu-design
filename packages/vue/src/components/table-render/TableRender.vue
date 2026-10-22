<script setup lang="ts">
import type { ComponentPublicInstance, PropType, VNodeChild } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { columnRenders } from "./column-renders";
import { computed, isVNode, onMounted, ref, watch } from "vue";
import { Checkbox } from "@/components/checkbox";
import { FormRender, type FormRenderDefinition } from "@/components/form-render";
import { Skeleton } from "@/components/skeleton";
import TablePagination from "./TablePagination.vue";
import type {
  DataRecord,
  SortableOptions,
  TableColumnOptions,
  TableLoadParams,
  TableRenderDefinition,
  TableSelectionOptions,
  TreeOptions,
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
  /** 搜索表单（defineForm 返回值）：拆分式直接传；聚合式请在 defineTable 配置（definition 优先，同传 DEV 警告） */
  search: { type: Object as PropType<FormRenderDefinition<any>> },
  /** 虚拟滚动：开启后表体行虚拟化渲染；聚合式请在 defineTable 配置（definition 优先）；须同时给 height */
  virtual: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 虚拟滚动容器高度（数字 px 或 CSS 高度）；仅 virtual: true 时生效 */
  height: { type: [Number, String] as PropType<number | string> },
  /** 树形数据（子行展开/收起）；拆分式直接传，聚合式请在 defineTable 配置 */
  tree: { type: Object as PropType<TreeOptions> },
});

const emit = defineEmits<{
  "update:page-index": [pageIndex: number];
  "update:page-size": [pageSize: number];
  "sort-change": [sort: SortableOptions | undefined];
  "row-click": [record: DataRecord, index: number, event: MouseEvent];
  "selection-change": [rows: DataRecord[]];
  "update:selected-keys": [keys: Array<string | number>];
  /** 搜索：FormRender 校验通过后触发；载荷为当前表单值 */
  search: [values: DataRecord];
  /** 重置：FormRender 已重置为 defaults 后触发；载荷为重置后的表单值 */
  reset: [values: DataRecord];
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
    search: props.search,
    virtual: props.virtual,
    height: props.height,
    tree: props.tree,
  });
// 拆分式已传 rowKey；聚合式由组件回填（S1：选择引擎依赖 rowKey 就绪）
instance.setRowKey(props.rowKey);

// ---- 搜索表单（FormRender 联动） --------------------------------------------
// 与 rowSelection 不同：聚合式下 prop 未被 definition 覆盖时回填引擎（不做聚合式忽略限制）；
// definition 与 prop 二选一，definition 优先，同传 DEV 警告
if (props.definition && props.search) {
  if (instance.search && import.meta.env.DEV) {
    console.warn(
      "[tu-design] <TableRender> 聚合式下 search 已在 defineTable 配置，组件 prop 已忽略。",
    );
  } else {
    instance.setSearch(props.search);
  }
}
// search 不支持运行时切换（与 FormRender definition/form 同款约定），setup 期定版即可
const search = instance.search;

/** 当前搜索表单值快照（浅拷贝；无 search 时为空对象） */
function searchValues(): DataRecord {
  return search ? { ...search.form.state.values } : {};
}

/** 搜索：校验已由 FormRender 完成；归位第 1 页重载，分页/排序取数自动携带最新表单值 */
function onSearch() {
  emit("search", searchValues());
  instance.reload(true);
}

/** 重置：FormRender 已同步重置为 defaults（TanStack reset 为同步 setState），此刻读取即 defaults */
function onReset() {
  emit("reset", searchValues());
  instance.reload(true);
}

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

// ---- 固定列（sticky） --------------------------------------------------------

/** 选择列在 sticky 映射中的哨兵键（选择列不在 columns 内，模板单独渲染） */
const SELECTION_CELL = "__selection__";

// DEV 校验：sticky 偏移只能从数字 width（px）推算，否则降级普通列（columns setup 期定版，只查一次）
for (const column of columns.value) {
  if (column.fixed !== undefined && typeof column.width !== "number") {
    console.warn(
      `[tu-design] <TableRender> fixed 列 "${column.key}" 需要数字 width，已忽略 fixed。`,
    );
  }
}

/** sticky 单元格映射（纯渲染层 computed，不进 TanStack pinning state）：
 * 选择列视作最左 fixed 列参与累计（offset 0）；fixed-left 按列序累加，
 * fixed-right 从最右列反向累计。edge = 该 sticky 组朝滚动方向的交界列（加分隔边框）。
 */
const stickyOf = computed(() => {
  const map = new Map<string, { side: "left" | "right"; offset: number; edge: boolean }>();
  // instance.columns 是联合数组（聚合式 any / 拆分式 DataRecord），联合上的 filter
  // 类型谓词重载解析不可靠，故 map 提取时以断言收窄 width（条件已含 typeof 守卫）
  const lefts = columns.value
    .filter((column) => column.fixed === "left" && typeof column.width === "number")
    .map((column) => ({ key: column.key, width: column.width as number }));
  const rights = columns.value
    .filter((column) => column.fixed === "right" && typeof column.width === "number")
    .map((column) => ({ key: column.key, width: column.width as number }));

  let acc = 0;
  if (hasSelection.value) {
    map.set(SELECTION_CELL, { side: "left", offset: 0, edge: lefts.length === 0 });
    acc = selection.value.width;
  }
  lefts.forEach((left, index) => {
    map.set(left.key, { side: "left", offset: acc, edge: index === lefts.length - 1 });
    acc += left.width;
  });

  let racc = 0;
  for (let index = rights.length - 1; index >= 0; index--) {
    const right = rights[index]!;
    map.set(right.key, { side: "right", offset: racc, edge: index === 0 });
    racc += right.width;
  }
  return map;
});

/** sticky 定位样式；head 为 true 时 z-index 高于表体（表头 sticky 压住表体 sticky） */
function stickyStyle(key: string, head: boolean) {
  const sticky = stickyOf.value.get(key);
  if (!sticky) return undefined;
  return {
    position: "sticky" as const,
    [sticky.side]: `${sticky.offset}px`,
    zIndex: head ? 20 : 10,
  };
}

/** sticky 底色（防滚动透出）与交界分隔边框 */
function stickyClass(key: string) {
  const sticky = stickyOf.value.get(key);
  if (!sticky) return undefined;
  return [
    "bg-background",
    sticky.side === "left" && sticky.edge ? "border-r border-border" : "",
    sticky.side === "right" && sticky.edge ? "border-l border-border" : "",
  ];
}

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
    /** TanStack Row：树形渲染读 depth / getCanExpand / getIsExpanded / toggleExpanded */
    row,
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

// ---- 树形数据（T 系列） ------------------------------------------------------
// 引擎是唯一解析点（无效配置已 warn 并忽略，回传 undefined）；tree 为 undefined 时不渲染缩进与 caret
const tree = instance.tree;
const treeIndent = tree?.indentSize ?? 16;

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

// ---- 虚拟滚动 ----------------------------------------------------------------
// definition 优先于 prop（配置定版，不支持运行时切换）
const virtualRaw = instance.virtual ?? props.virtual;
const heightRaw = instance.height ?? props.height;
if (virtualRaw === true && heightRaw === undefined) {
  console.warn("[tu-design] <TableRender> virtual 需要配置 height，已降级普通渲染。");
}
const virtualEnabled = virtualRaw === true && heightRaw !== undefined;
const scrollHeight = computed(() => (typeof heightRaw === "number" ? `${heightRaw}px` : heightRaw));

const scrollEl = ref<HTMLElement | null>(null);
const theadEl = ref<HTMLElement | null>(null);
/** 滚动容器内 thead 占据的前缀高度（scrollMargin）；表头内容静态，挂载后测量一次 */
const theadOffset = ref(0);

// 仅 virtual: true 且 height 就绪时创建（配置 setup 期定版，顶层条件分支可安全注册生命周期）
const virtualizerRef = virtualEnabled
  ? useVirtualizer(
      computed(() => ({
        count: rows.value.length, // 翻页/重载后行窗口变化 → options 更新（setOptions 自动生效）
        getScrollElement: () => scrollEl.value,
        estimateSize: () => 40,
        overscan: 8,
        getItemKey: (index: number) => rowKeyOf(rows.value[index]!, index), // rowKey 作为虚拟行 key
        scrollMargin: theadOffset.value, // thead 在滚动容器内的 offset 前缀
      })),
    )
  : null;

onMounted(() => {
  if (virtualEnabled) theadOffset.value = theadEl.value?.offsetHeight ?? 0;
});

const virtualRows = computed(() => (virtualizerRef ? virtualizerRef.value.getVirtualItems() : []));
const virtualTotal = computed(() => (virtualizerRef ? virtualizerRef.value.getTotalSize() : 0));
/** 窗口行 + 对应全量行数据（cells 矩阵已由 body computed 缓存，虚拟化只裁剪 DOM 节点） */
const virtualLines = computed(() =>
  virtualRows.value.map((row) => ({ row, line: body.value[row.index]! })),
);
const padTop = computed(() => virtualRows.value[0]?.start ?? 0);
const padBottom = computed(() => {
  const items = virtualRows.value;
  return items.length === 0 ? 0 : Math.max(0, virtualTotal.value - items[items.length - 1]!.end);
});

/** 行高动态测量：measureElement 读 data-index 把实测高度写回（行内容高度可变，不假设固定行高） */
function measureRow(node: Element | ComponentPublicInstance | null) {
  if (node instanceof Element) virtualizerRef?.value.measureElement(node);
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
    <!-- 搜索区：FormRender 校验通过才发 search；重置按钮缺省跟随 searchable -->
    <FormRender
      v-if="search"
      class="mb-4"
      :definition="search"
      searchable
      @search="onSearch"
      @reset="onReset"
    />

    <!-- 滚动容器：横向滚动时 fixed 列 sticky 生效；virtual 模式兼任纵向滚动（分页条不参与滚动） -->
    <div
      ref="scrollEl"
      class="overflow-x-auto"
      :style="virtualEnabled ? { height: scrollHeight, overflowY: 'auto' } : undefined"
    >
      <table class="w-full caption-bottom text-sm">
        <thead ref="theadEl" class="[&_tr]:border-b">
          <tr>
            <!-- 选择列：checkbox 型表头为本页全选三态（S3/S10）；radio 型占位；视作最左固定列 -->
            <th
              v-if="hasSelection"
              scope="col"
              class="h-10 w-12 px-2 align-middle font-medium text-muted-foreground"
              :class="stickyClass(SELECTION_CELL)"
              :style="[{ width: `${selection.width}px` }, stickyStyle(SELECTION_CELL, true)]"
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
              :class="stickyClass(column.key)"
              :style="[
                { width: column.width, textAlign: column.align },
                stickyStyle(column.key, true),
              ]"
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
          <!-- 加载态：固定 5 行骨架（R14）；选择列一并占位（S8）；骨架不虚拟化 -->
          <template v-if="loading">
            <tr v-for="row in SKELETON_ROWS" :key="row" data-skeleton>
              <td
                v-if="hasSelection"
                class="p-2 align-middle"
                :class="stickyClass(SELECTION_CELL)"
                :style="stickyStyle(SELECTION_CELL, false)"
              >
                <Skeleton class="size-4" />
              </td>
              <td
                v-for="column in columns"
                :key="column.key"
                class="p-2 align-middle"
                :class="stickyClass(column.key)"
                :style="[{ textAlign: column.align }, stickyStyle(column.key, false)]"
              >
                <Skeleton class="h-4 w-full" />
              </td>
            </tr>
          </template>

          <!-- 虚拟滚动：窗口行 + 前后占位行（总高撑开滚动区间；行高经 measureElement 动态测量） -->
          <template v-else-if="virtualEnabled">
            <tr aria-hidden="true" data-virtual-pad :style="{ height: `${padTop}px` }">
              <td :colspan="columnCount" class="border-0 p-0"></td>
            </tr>
            <tr
              v-for="item in virtualLines"
              :key="item.line.key"
              :ref="measureRow"
              :data-index="item.row.index"
              class="border-b transition-colors hover:bg-muted/50"
              @click="onRowClick(item.line.record, item.line.index, $event)"
            >
              <!-- 选择单元格：阻断冒泡避免触发行 row-click（S5）；radio 为原生控件 -->
              <td
                v-if="hasSelection"
                class="w-12 p-2 align-middle"
                :class="stickyClass(SELECTION_CELL)"
                :style="stickyStyle(SELECTION_CELL, false)"
                @click.stop
              >
                <input
                  v-if="selection.type === 'radio'"
                  type="radio"
                  class="accent-primary size-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  :checked="selectedKeys.has(item.line.key)"
                  :disabled="!item.line.canSelect"
                  :aria-label="`选择第 ${item.line.index + 1} 行`"
                  @click="onRowSelect(item.line, !selectedKeys.has(item.line.key))"
                />
                <Checkbox
                  v-else
                  :checked="selectedKeys.has(item.line.key)"
                  :disabled="!item.line.canSelect"
                  :aria-label="`选择第 ${item.line.index + 1} 行`"
                  @update:checked="(checked: boolean) => onRowSelect(item.line, checked)"
                />
              </td>
              <td
                v-for="(value, index) in item.line.cells"
                :key="columns[index].key"
                class="p-2 align-middle"
                :class="[stickyClass(columns[index].key), { truncate: columns[index].ellipsis }]"
                :title="columns[index].ellipsis ? cellText(item.line, index) : undefined"
                :style="[
                  { textAlign: columns[index].align },
                  stickyStyle(columns[index].key, false),
                ]"
              >
                <!-- 首列（tree 启用时）：depth 缩进 + 展开 caret（点击 stop 避免误触发行点击） -->
                <span
                  v-if="tree && index === 0"
                  class="inline-flex max-w-full items-center gap-1"
                  :style="{ marginLeft: `${item.line.row.depth * treeIndent}px` }"
                >
                  <button
                    v-if="item.line.row.getCanExpand()"
                    type="button"
                    class="hover:bg-muted text-muted-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm"
                    :aria-expanded="item.line.row.getIsExpanded()"
                    :aria-label="item.line.row.getIsExpanded() ? '收起' : '展开'"
                    @click.stop="item.line.row.toggleExpanded()"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="size-3.5 transition-transform"
                      :class="{ 'rotate-90': item.line.row.getIsExpanded() }"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
                  <component :is="value" v-if="isVNode(value)" />
                  <span v-else class="min-w-0 truncate">{{ value }}</span>
                </span>
                <template v-else>
                  <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
                  <component :is="value" v-if="isVNode(value)" />
                  <template v-else>{{ value }}</template>
                </template>
              </td>
            </tr>
            <tr aria-hidden="true" data-virtual-pad :style="{ height: `${padBottom}px` }">
              <td :colspan="columnCount" class="border-0 p-0"></td>
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
              <td
                v-if="hasSelection"
                class="w-12 p-2 align-middle"
                :class="stickyClass(SELECTION_CELL)"
                :style="stickyStyle(SELECTION_CELL, false)"
                @click.stop
              >
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
                :class="[stickyClass(columns[index].key), { truncate: columns[index].ellipsis }]"
                :title="columns[index].ellipsis ? cellText(line, index) : undefined"
                :style="[
                  { textAlign: columns[index].align },
                  stickyStyle(columns[index].key, false),
                ]"
              >
                <!-- 首列（tree 启用时）：depth 缩进 + 展开 caret（点击 stop 避免误触发行点击） -->
                <span
                  v-if="tree && index === 0"
                  class="inline-flex max-w-full items-center gap-1"
                  :style="{ marginLeft: `${line.row.depth * treeIndent}px` }"
                >
                  <button
                    v-if="line.row.getCanExpand()"
                    type="button"
                    class="hover:bg-muted text-muted-foreground inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm"
                    :aria-expanded="line.row.getIsExpanded()"
                    :aria-label="line.row.getIsExpanded() ? '收起' : '展开'"
                    @click.stop="line.row.toggleExpanded()"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="size-3.5 transition-transform"
                      :class="{ 'rotate-90': line.row.getIsExpanded() }"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                  <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
                  <component :is="value" v-if="isVNode(value)" />
                  <span v-else class="min-w-0 truncate">{{ value }}</span>
                </span>
                <template v-else>
                  <!-- VNode 必须走子节点渲染；文本插值会序列化 vnode 导致循环引用 -->
                  <component :is="value" v-if="isVNode(value)" />
                  <template v-else>{{ value }}</template>
                </template>
              </td>
            </tr>
          </template>

          <!-- 空态：横跨全列的单单元格，不虚拟化 -->
          <tr v-if="!loading && body.length === 0" data-empty>
            <td :colspan="columnCount" class="p-8 text-center text-muted-foreground">
              <slot name="empty">{{ emptyText ?? "暂无数据" }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

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
