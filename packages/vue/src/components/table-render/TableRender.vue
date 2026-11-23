<script setup lang="ts">
import type { ComponentPublicInstance, PropType, VNodeChild } from "vue";
import { useVirtualizer } from "@tanstack/vue-virtual";
import { columnRenders } from "./column-renders";
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { FormRenderDefinition } from "@/components/form-render";
import { Button } from "@/components/button";
import { Checkbox } from "@/components/checkbox";
import { Skeleton } from "@/components/skeleton";
import { cn } from "@/lib/utils";
import { isColumnGroup } from "./columns";
import { PAGE_TABLE_FILL_KEY, DRAG_CELL, SELECTION_CELL } from "./constants";
import { stickyClass, stickyStyle } from "./sticky";
import { useStickyLayout } from "./useStickyLayout";
import { useTableHeaderModel } from "./useTableHeaderModel";
import type { TableHeaderViewActions, TableHeaderViewModel } from "./useTableHeaderModel";
import ColumnSettingsPanel from "./ColumnSettingsPanel.vue";
import TableContextMenu from "./TableContextMenu.vue";
import TableBodyRow from "./TableBodyRow.vue";
import TableHeader from "./TableHeader.vue";
import TableColumnSettings from "./TableColumnSettings.vue";
import TableToolbar from "./TableToolbar.vue";
import type { TableContextMenuContext, TableMenuItem } from "./context-menu-types";
import { useColumnSettingsController } from "./useColumnSettingsController";
import { useTableContextMenu } from "./useTableContextMenu";
import { strategyFixed, useTuProvider } from "@/components/overlay-shared/config";
import TablePagination from "./TablePagination.vue";
import type {
  ColumnVisibilityOptions,
  DataRecord,
  SortableOptions,
  TableBodyLine,
  TableColumnGroupOptions,
  TableColumnNode,
  TableColumnOptions,
  TableDraggableOptions,
  TableDragSortPayload,
  TableLoadParams,
  TableRenderDefinition,
  TableSelectionOptions,
  TreeOptions,
} from "./types";
import { useTableRender } from "./useTableRender";
import { createRowSnapshot, useRowDrag } from "./useRowDrag";

// boolean flags 用运行时声明 + default: undefined 禁用 Vue 的 Boolean casting
// （casting 会让未传的 prop 变 false；Checkbox/Dialog/FormRender 同款约定）
const props = defineProps({
  /** 聚合式（推荐）：defineTable 返回的定义对象 */
  definition: { type: Object as PropType<TableRenderDefinition<any>> },
  /** 数据主键（记录缺字段时以行索引兜底） */
  rowKey: { type: String, required: true },
  /** 拆分式：与 definition 二选一，definition 优先（支持分组列节点；列泛型不约束记录形态） */
  columns: { type: Array as PropType<TableColumnNode<any>[]> },
  onLoad: {
    type: Function as PropType<(params: TableLoadParams) => void | Promise<unknown>>,
  },
  data: { type: Array as PropType<DataRecord[]> },
  autoLoad: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 每页条数 / 受控每页条数：传入即受控（pageIndex 未受控时页码归位内部处理并通知） */
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
  /** 行拖拽排序（仅拆分式生效；聚合式请在 defineTable 配置）：true 或对象配置；与 tree/virtual 互斥 */
  draggable: {
    type: [Boolean, Object] as PropType<boolean | TableDraggableOptions>,
    default: undefined,
  },
  /** 受控页码（1-based）：传入即受控，缺省非受控；内部翻页经 update:page-index 通知 */
  pageIndex: { type: Number },
  /** 受控排序：传入即受控；内部/外部变化均经 sort-change 通知 */
  sort: { type: Object as PropType<SortableOptions> },
  /** 受控选中集（数组，与 update:selected-keys 载荷同构）：传入即受控 */
  selectedKeys: { type: Array as PropType<Array<string | number>> },
  /** 受控可见列 key（columns 原序子集）：传入即受控；内部显隐经 update:visible-keys 通知 */
  visibleKeys: { type: Array as PropType<string[]> },
  /** 拆分式默认可见列集；与聚合式 columnVisibility.defaultVisibleKeys 同传时 DEV 警告（definition 优先） */
  defaultVisibleKeys: { type: Array as PropType<string[]> },
  /** 列设置触发器/面板开关（默认 true）；false 时不渲染 UI，受控 API 不受影响 */
  columnSettings: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 列设置入口位置：auto/toolbar = 顶栏文字链接；header = 表头叶子 ⋮（opt-in） */
  columnSettingsPlacement: {
    type: String as PropType<"auto" | "toolbar" | "header">,
    default: "auto",
  },
  /** 右键命令菜单：false 关闭（默认）；true 用默认项；函数返回业务项 */
  contextMenu: {
    type: [Boolean, Function] as unknown as PropType<
      boolean | ((ctx: TableContextMenuContext<any>) => TableMenuItem<any>[])
    >,
    default: false,
  },
  /** 搜索区渲染开关：false 关闭内置搜索区（组合式外置 FormRender）；数据链路不变 */
  showSearch: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 分页条渲染开关：false 关闭内置分页条（组合式外置 TablePagination）；缺省模式单页自隐藏不变 */
  showPagination: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 填充模式：根容器 h-full 纵向 flex，滚动区 flex-1 内滚；表头 sticky 钉住。
   * 父链需有确定高度（如页面布局的 .table-body）；无确定高度时安全退化为自然高度。
   * 显式 prop 优先于布局 provide（key: "tu-design:page-table-fill"）；显式传 false 可强制关闭。
   * 纯布局属性，不进 defineTable/definition（virtual/height 例外），setup 期定版不支持运行时切换。 */
  fillHeight: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 是否显示表格边框（仅外框）；网格线由 single-column / single-line 独立控制（正交模型，词汇对齐 naive-ui） */
  bordered: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 表格底部是否有边框；bordered: true 时外框已含底边，此参数冗余无害 */
  bottomBordered: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 是否不设定行的分割线；true 时单元格没有下边线 */
  singleColumn: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 是否不设定列的分割线；true 时单元格没有右边线 */
  singleLine: { type: Boolean as PropType<boolean | undefined>, default: undefined },
  /** 斑马线条纹（按行模型索引奇偶，虚拟滚动窗口安全）；纯样式属性，setup 期定版不支持运行时切换 */
  striped: { type: Boolean as PropType<boolean | undefined>, default: undefined },
});

// ---- 填充模式（fillHeight）---------------------------------------------------
// 布局上下文：页面布局容器 provide 同名 key，slot 内 TableRender 自动 fill。
// 字符串 key 跨包约定（常量 PAGE_TABLE_FILL_KEY 已导出，消费方零依赖时按字符串值 provide），
// setup 期定版，不支持运行时切换（与 virtual/search 同约定）。
const pageTableFill = inject<boolean>(PAGE_TABLE_FILL_KEY, false);
const fill = props.fillHeight ?? pageTableFill;

const emit = defineEmits<{
  "update:page-index": [pageIndex: number];
  "update:page-size": [pageSize: number];
  "sort-change": [sort: SortableOptions | undefined];
  "row-click": [record: DataRecord, index: number, event: MouseEvent];
  /** 行双击（与 row-click 独立，双击会先后触发 click 两次，属预期） */
  "row-dblclick": [record: DataRecord, index: number, event: MouseEvent];
  /** 行右键；不主动 preventDefault */
  "row-contextmenu": [record: DataRecord, index: number, event: MouseEvent];
  /** 右键菜单已打开（contextMenu 显式开启时） */
  "context-menu": [ctx: TableContextMenuContext<any>];
  /** 右键菜单项选中且业务项无 onSelect 时 */
  "context-menu-select": [value: string, ctx: TableContextMenuContext<any>];
  /** 单元格点击（columnKey 定位列）；冒泡并存——cell-click 触发时 row-click 也会触发 */
  "cell-click": [record: DataRecord, columnKey: string, index: number, event: MouseEvent];
  "selection-change": [rows: DataRecord[]];
  "update:selected-keys": [keys: Array<string | number>];
  /** 搜索：FormRender 校验通过后触发；载荷为当前表单值 */
  search: [values: DataRecord];
  /** 重置：FormRender 已重置为 defaults 后触发；载荷为重置后的表单值 */
  reset: [values: DataRecord];
  /** 服务端模式 onLoad 抛错/ rejects 时触发；下一次 load 开始时 error 投影清除 */
  "load-error": [error: Error];
  /** 可见列变化（受控回写通知 / v-model:visible-keys） */
  "update:visible-keys": [keys: string[]];
  /** 列显隐变化（受控/非受控均触发，供业务持久化；载荷 = 可见列 key 有序数组，columns 原序） */
  "column-visibility-change": [keys: string[]];
  /** 行拖拽落位（仅成功 drop 触发，取消路径不发）：from/to 为页内索引，rows = 当前页新行序。
   * 静态模式引擎已先行重排，调用方应回写自身数据源；服务端模式需持久化后 reload */
  "drag-sort": [payload: TableDragSortPayload];
}>();

defineSlots<{
  empty?: () => VNodeChild;
  /** 错误态占位（服务端模式 onLoad 失败时渲染，优先于数据区） */
  error?: (props: { error: Error | undefined; retry: () => void }) => VNodeChild;
}>();

/** 加载态骨架行数 */
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
if (props.definition && props.draggable !== undefined && import.meta.env.DEV) {
  console.warn(
    "[tu-design] <TableRender> 聚合式下 draggable 请在 defineTable 配置，组件 prop 已忽略。",
  );
}
// 显式 any 泛型：Row 的泛型为 in out（不变），拆分式推断出的 DataRecord 具型与
// definition<any> 逃逸舱口互不相容（TS6 getParentRow 递归比对报 unrelated）
const instance: TableRenderDefinition<any> =
  props.definition ??
  useTableRender({
    columns: props.columns ?? [],
    onLoad: props.onLoad,
    data: () => props.data,
    autoLoad: props.autoLoad,
    pageSizeOpts: props.pageSizeOpts,
    rowKey: props.rowKey,
    rowSelection: props.rowSelection,
    search: props.search,
    virtual: props.virtual,
    height: props.height,
    tree: props.tree,
    draggable: props.draggable,
    pageIndex: () => props.pageIndex,
    pageSize: () => props.pageSize,
    sort: () => props.sort,
    selectedKeys: () => props.selectedKeys,
    // 聚合式 columnVisibility 由 definition 自带路径承载；拆分式此处恒空（TS6 下 ?? 右侧收窄坐实）
    defaultVisibleKeys: () => props.defaultVisibleKeys,
    visibleKeys: () => props.visibleKeys,
  });
// 拆分式已传 rowKey；聚合式由组件回填（选择引擎依赖 rowKey 就绪）
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

// ---- 列显隐（column visibility） ------------------------------------
// 聚合式（columnVisibility.defaultVisibleKeys 经引擎解析回传）与拆分式 prop 同传 → definition 优先。
// 引擎是唯一解析点；聚合式受控回填经 setVisibleKeys（normalize 等值守卫防回弹）；
// 拆分式由引擎受控 watch 直接同步（源 = props getter）
if (
  props.definition &&
  instance.defaultVisibleKeys !== undefined &&
  props.defaultVisibleKeys !== undefined &&
  import.meta.env.DEV
) {
  console.warn(
    "[tu-design] <TableRender> 聚合式下 defaultVisibleKeys 已在 columnVisibility 配置，组件 prop 已忽略。",
  );
}
watch(
  () => props.visibleKeys,
  (next) => {
    if (props.definition && next !== undefined) instance.setVisibleKeys(next);
  },
  { immediate: true },
);

/**
 * 当前搜索表单值快照（浅拷贝；无 search 时为空对象）
 * @returns 表单值快照
 */
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
/** 内部加载态 ∪ 外部受控加载态 */
const loading = computed(() => props.loading === true || instance.loading.value);
const showPagination = computed(() => Math.ceil(instance.page.total / instance.page.pageSize) > 1);
/** 内置分页条开关：showPagination=false 关闭；单页自隐藏仅作用于缺省模式 */
const showPaginationBar = computed(() => showPagination.value && props.showPagination !== false);
/** 内置搜索区开关：配置了 search 且未被 showSearch=false 关闭；列设置触发器不受影响 */
const showSearchArea = computed(() => search !== undefined && props.showSearch !== false);

// ---- 错误态（服务端模式 onLoad 失败） ----------------------------------------
// loading 判定优先；error 优先于正常数据（load 开始时引擎已清除旧错误，loading 期间 error 恒空）
const loadError = computed(() => instance.error.value);
const showError = computed(() => !loading.value && loadError.value !== undefined);

watch(loadError, (err) => {
  if (err) emit("load-error", err);
});

function retry() {
  instance.reload();
}

// ---- 行选择（S 系列） -------------------------------------------------------
const selection = computed(() => instance.selection);
const selectedKeys = instance.selectedKeys;
const hasSelection = computed(() => selection.value.enabled);

// ---- 列显隐（column visibility） -------------------------------------
const visibleKeySet = computed(() => new Set(instance.visibleKeys.value));
/** 可见业务列（columns 原序子集）：header/body/骨架/colspan/sticky 全部基于此渲染 */
const visibleColumns = computed(() =>
  columns.value.filter((column) => visibleKeySet.value.has(column.key)),
);

// ---- 表头分组（多级表头） -------------------------------------------
// 原始列节点树（definition.columnTree 缺省时回退扁平列 = 单级表头）
const columnsTree = computed<TableColumnNode<DataRecord>[]>(
  () => (instance.columnTree as TableColumnNode<DataRecord>[]) ?? columns.value,
);

/** 表头模型：可见树 / 深度 / 表头矩阵统一由 useTableHeaderModel 派生（T02 纯逻辑模块） */
const { headerRows } = useTableHeaderModel({
  tree: () => columnsTree.value,
  visibleKeySet,
});

/** 列设置触发器/面板开关（默认 true）；false 时不渲染 UI，受控 API 不受影响 */
const showColumnSettings = computed(() => props.columnSettings ?? true);

// ---- 浮层定位基准：普通文档 absolute（随表格滚动）；iframe 沙箱回退 fixed ----------
/** 表格根节点（浮层锚点的 absolute 定位包含块） */
const rootEl = ref<HTMLElement | null>(null);
const tuProvider = useTuProvider();
/** 沙箱（iframe realm）下 absolute 包含块会错位，回退 fixed（与 overlay-shared 口径一致） */
const overlayStrategy = computed<"absolute" | "fixed">(() =>
  strategyFixed(tuProvider.mode) ? "fixed" : "absolute",
);
/** 两个浮层 controller 共用同一根节点与定位策略，避免两处漂移 */
const overlayAnchorOptions = {
  getRoot: () => rootEl.value ?? undefined,
  anchorPosition: () => overlayStrategy.value,
};

// ---- 列设置面板：controller（开合/锚点）+ 子组件（面板纯内容） ----------------
const columnSettings = useColumnSettingsController(overlayAnchorOptions);
/** 表头 ⋮ 与工具栏入口互斥：placement=header 时顶栏不再渲染列设置入口 */
const showToolbarColumnSettings = computed(
  () => showColumnSettings.value && props.columnSettingsPlacement !== "header",
);

// ---- 右键命令菜单（默认关闭；仅 contextMenu 真值挂根级 handler） ----------------
/**
 * 在列树中按 DFS 路径查找分组节点
 * @param nodes - 列节点树
 * @param path - 形如 "0-1" 的路径
 * @returns 命中的分组节点；未命中 undefined
 */
function findColumnGroup(
  nodes: TableColumnNode<DataRecord>[],
  path: string,
): TableColumnGroupOptions<DataRecord> | undefined {
  for (const [index, node] of nodes.entries()) {
    const current = String(index);
    if (path === current && isColumnGroup(node)) return node;
    if (path.startsWith(`${current}-`) && isColumnGroup(node)) {
      const found = findColumnGroup(node.children, path.slice(current.length + 1));
      if (found) return found;
    }
  }
  return undefined;
}

const contextMenuController = useTableContextMenu({
  ...overlayAnchorOptions,
  menu: () => props.contextMenu,
  snapshot: () => ({
    selection: {
      keys: [...selectedKeys.value].map(String),
      rows: body.value
        .filter((line) => new Set([...selectedKeys.value].map(String)).has(line.key))
        .map((line) => line.record),
    },
    visibleKeys: instance.visibleKeys.value,
    columns: columns.value,
  }),
  defaults: () => ({
    columnSettingsEnabled: showColumnSettings.value,
    hasDefaultVisibleKeys: instance.defaultVisibleKeys !== undefined,
    openColumnSettings: openContextColumnSettings,
    resetColumns: () =>
      instance.setVisibleKeys(
        instance.defaultVisibleKeys ?? columns.value.map((column) => column.key),
      ),
    showAllColumns: () => instance.setVisibleKeys(columns.value.map((column) => column.key)),
  }),
  meta: () => ({
    rowOf: (rowKey) => {
      const line = body.value.find((item) => item.key === rowKey);
      return line ? { record: line.record, index: line.index } : undefined;
    },
    columnOf: (columnKey) => columns.value.find((column) => column.key === columnKey),
    groupOf: (groupPath) => findColumnGroup(columnsTree.value, groupPath),
  }),
  onOpen: (ctx) => emit("context-menu", ctx),
  onMenuSelect: (value, ctx) => emit("context-menu-select", value, ctx),
});

/** 打开列设置面板：右键来源为表头/单元格时高亮该列（协议⑤：菜单已在项内先关） */
function openContextColumnSettings() {
  const ctx = contextMenuController.context.value;
  const target = ctx?.target;
  const columnKey =
    target?.kind === "header"
      ? target.columnKey
      : target?.kind === "cell"
        ? target.columnKey
        : undefined;
  if (ctx) columnSettings.openAt(ctx.event, columnKey);
  else columnSettings.openAt(document.body, columnKey);
}

/**
 * 根节点 contextmenu：接管时屏蔽原生菜单（内置菜单与原生菜单不再叠加）
 * @param event - contextmenu 事件
 */
function onTableContextMenu(event: MouseEvent) {
  if (contextMenuController.onContextMenu(event)) event.preventDefault();
}

/** 根节点 contextmenu 绑定：默认关闭时不挂 handler（协议①） */
const contextMenuBindings = computed(() =>
  props.contextMenu ? { onContextmenu: onTableContextMenu } : {},
);

/**
 * 表体滚动容器滚动：浮层锚点会与内容脱节，直接关闭两个浮层。
 * 页面滚动不关闭——浮层用 absolute 根相对定位，会随表格一起移动。
 */
function onInnerScroll() {
  contextMenuController.close();
  columnSettings.close();
}

onMounted(() => {
  scrollEl.value?.addEventListener("scroll", onInnerScroll, { passive: true });
});
onBeforeUnmount(() => {
  scrollEl.value?.removeEventListener("scroll", onInnerScroll);
});

// 受控/非受控均通知：统一投影变化 → 双事件（载荷 = columns 原序可见 key）
watch(instance.visibleKeys, (keys) => {
  emit("update:visible-keys", [...keys]);
  emit("column-visibility-change", [...keys]);
});

/** 总列数 = 可见业务列 + 选择列（空态 colspan 与骨架行） */
const columnCount = computed(
  () => visibleColumns.value.length + (hasSelection.value ? 1 : 0) + (dragEnabled.value ? 1 : 0),
);

// ---- 固定列（sticky） --------------------------------------------------------

// DEV 校验：sticky 偏移只能从数字 width（px）推算，否则降级普通列（columns setup 期定版，只查一次）
for (const column of columns.value) {
  if (column.fixed !== undefined && typeof column.width !== "number") {
    console.warn(
      `[tu-design] <TableRender> fixed 列 "${column.key}" 需要数字 width，已忽略 fixed。`,
    );
  }
}

// DEV 校验（一次性）：分组节点误配 key/sortable/fixed/width、空 children（列节点树定版）
if (import.meta.env.DEV) {
  const validateNodes = (nodes: TableColumnNode<DataRecord>[], depth: number) => {
    for (const node of nodes) {
      if (isColumnGroup(node)) {
        if ("key" in node && (node as { key?: unknown }).key !== undefined) {
          console.warn(
            "[tu-design] <TableRender> 分组节点不应配置 key（分组不是数据列），已忽略。",
          );
        }
        if ((node as { sortable?: unknown }).sortable !== undefined) {
          console.warn(
            `[tu-design] <TableRender> 分组「${node.title}」不支持 sortable（仅叶子列可排序），已忽略。`,
          );
        }
        if ((node as { fixed?: unknown }).fixed !== undefined) {
          console.warn(
            `[tu-design] <TableRender> 分组「${node.title}」不支持 fixed（请配置到叶子列），已忽略。`,
          );
        }
        if (node.children.length === 0) {
          console.warn(`[tu-design] <TableRender> 分组「${node.title}」children 为空，将被忽略。`);
        }
        validateNodes(node.children, depth + 1);
      } else if ("children" in node && (node as { children?: unknown }).children !== undefined) {
        console.warn(
          `[tu-design] <TableRender> 叶子列 "${node.key}" 不应配置 children，已按叶子渲染。`,
        );
      }
    }
  };
  validateNodes(columnsTree.value, 0);
}

// DEV 提示（一次性，columns setup 期定版）：多列宽表全列无数字 width 时，
// min-width 横滚不可达 —— 宽表请为列声明数字 width（px）。
if (columns.value.length >= 10 && !columns.value.some((c) => typeof c.width === "number")) {
  console.warn(
    `[tu-design] <TableRender> ${columns.value.length} 列均无数字 width，` +
      `窄容器下不会出现横向滚动；宽表请为列声明数字 width（px）。`,
  );
}

/** 分组无需排序能力标记（sortable 仅叶子生效，对分组 sortable 警告） */

/** 表头全选三态：本页可选行与选中集求交派生（TanStack getter 追踪不稳，自算） */
const selectableKeys = computed(() =>
  rows.value.filter((row) => row.getCanSelect()).map((row) => row.id),
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

/**
 * 行选择控件切换；radio 不可取消由引擎守卫，不选中态点击传 checked=true
 * @param line - 行数据（含行 key）
 * @param checked - 目标选中态
 */
function onRowSelect(line: { key: string }, checked: boolean) {
  instance.toggleRowSelected(line.key, checked);
}

// 选中集变化 → 对外事件：排序/翻页不改变选中集，故不会误发
watch(instance.selectedKeys, (keys) => {
  emit("selection-change", [...selection.value.value]);
  emit("update:selected-keys", [...keys]);
});

/** 行 → 单元格值矩阵：render > formatter > record[key] */
const body = computed<TableBodyLine[]>(() => {
  // 渲染器工厂按列求值一次（而非每单元格），避免用户工厂内的重分配被放大
  const renderFns = new Map(
    columns.value.filter((c) => c.render).map((c) => [c, c.render!(RENDERS)]),
  );
  return rows.value.map((row) => ({
    /** TanStack Row：树形渲染读 depth / getCanExpand / getIsExpanded / toggleExpanded */
    row,
    key: row.id,
    index: row.index,
    record: row.original,
    /** 行级可选过滤：selectable 谓词交由引擎 enableRowSelection 判定 */
    canSelect: row.getCanSelect(),
    // 可见列的值矩阵（列显隐只裁剪列；状态不受影响）
    cells: visibleColumns.value.map((column): VNodeChild => {
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

// ---- 虚拟滚动 / 填充模式 ------------------------------------------------------
// definition 优先于 prop（配置定版，不支持运行时切换）
const virtualRaw = instance.virtual ?? props.virtual;
const heightRaw = instance.height ?? props.height;
// fill 模式自带真实滚动盒（flex-1 实测高度），virtual 无需显式 height
if (virtualRaw === true && heightRaw === undefined && !fill) {
  console.warn("[tu-design] <TableRender> virtual 需要配置 height，已降级普通渲染。");
}
const virtualEnabled = virtualRaw === true && (heightRaw !== undefined || fill);

// ---- 行拖拽排序（draggable） --------------------------------------------------
// 引擎是唯一配置解析点（tree/virtual 冲突已 warn 并忽略）；此处兜底聚合式 definition
// 与组件 prop virtual 同传的边界（引擎解析时看不到 prop）。配置 setup 期定版。
const dragConfig = instance.draggable;
const dragEnabled = computed(() => dragConfig !== undefined && !virtualEnabled);
const dragWidth = dragConfig?.width ?? 32;

/** sticky 布局：sticky 映射 + min-width + 分组表头样式由 useStickyLayout 派生（T02 纯逻辑模块） */
const { stickyOf, tableMinWidth, groupStickyStyle } = useStickyLayout({
  visibleColumns,
  columns,
  hasSelection,
  selectionWidth: computed(() => selection.value.width),
  dragEnabled,
  dragWidth: () => dragWidth,
});
const drag = useRowDrag();

// rowKey 记录级守卫：当前页任一记录缺 rowKey 字段 → 禁用拖拽（索引兜底态下行身份不稳定）
const dragKeysValid = computed(
  () => !dragEnabled.value || body.value.every((line) => line.record[props.rowKey] != null),
);
let dragRowKeyWarned = false;
watch(
  dragKeysValid,
  (valid) => {
    if (!valid && !dragRowKeyWarned && import.meta.env.DEV) {
      dragRowKeyWarned = true;
      console.warn(
        `[tu-design] <TableRender> 部分记录缺少 rowKey 字段 "${props.rowKey}"，已禁用行拖拽排序。`,
      );
    }
  },
  { immediate: true },
);

/**
 * 本行把手禁用判定：排序激活（动态守卫，取消排序恢复）/ rowKey 缺失 / 行级谓词 false
 * @param line - 行数据
 * @returns 是否禁用本行把手
 */
function rowDragDisabled(line: TableBodyLine): boolean {
  if (instance.sort.value !== undefined || !dragKeysValid.value) return true;
  return dragConfig?.draggable ? !dragConfig.draggable(line.record) : false;
}

// ---- 实时让位预览（组件层 overlay：引擎零改动、预览期间零事件） ----------------
// 只有被拖行在预览序中移动，其他行相对序恒定 → 让位后被拖行恰落在光标下，
// 后续 dragover 命中自身被忽略，天然不振荡（无需几何测量）。
const previewKeys = ref<string[] | undefined>(undefined);

/** 显示序：拖拽中按预览序重排（失效 key 过滤、新增行追加，防中途外部 data 变更）；平时即引擎序 */
const displayBody = computed<TableBodyLine[]>(() => {
  const keys = previewKeys.value;
  if (!keys) return body.value;
  const byKey = new Map(body.value.map((line) => [line.key, line]));
  const ordered: TableBodyLine[] = [];
  for (const key of keys) {
    const line = byKey.get(key);
    if (line) {
      ordered.push(line);
      byKey.delete(key);
    }
  }
  return ordered.concat([...byKey.values()]);
});

/** 离屏整行快照（仅真实浏览器 dataTransfer 存在时创建）；drop/dragend 时移除 */
let dragSnapshot: HTMLElement | undefined;

function removeDragSnapshot() {
  dragSnapshot?.remove();
  dragSnapshot = undefined;
}

/**
 * 起拖（把手 dragstart）：禁用行不接收；离屏克隆整行作为拖拽快照（幽灵影 = 带边框整行截图）
 * @param line - 源行数据
 * @param event - 原生 dragstart 事件
 */
function onRowDragStart(line: TableBodyLine, event: DragEvent) {
  if (rowDragDisabled(line)) return;
  const tr = (event.target as HTMLElement | null)?.closest?.("tr");
  let image: { el: Element; offsetX: number; offsetY: number } | undefined;
  if (event.dataTransfer && tr) {
    const rect = tr.getBoundingClientRect();
    dragSnapshot = createRowSnapshot(tr);
    image = {
      el: dragSnapshot,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }
  drag.start(line.key, event, image);
}

/**
 * 悬停让位：把被拖行移到悬停行在当前预览序中的位置（仅被拖行移动）
 * @param line - 悬停行数据
 * @param event - 原生 dragover 事件
 */
function onRowDragOver(line: TableBodyLine, event: DragEvent) {
  if (!drag.over(line.key, event)) return;
  const dragging = drag.draggingKey.value!;
  const keys = [...(previewKeys.value ?? body.value.map((item) => item.key))];
  const fromIndex = keys.indexOf(dragging);
  const toIndex = keys.indexOf(line.key);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;
  keys.splice(fromIndex, 1);
  keys.splice(toIndex, 0, dragging);
  previewKeys.value = keys;
}

/**
 * 成功落位：提交预览序。多跳预览的复合结果 ≡ 单次「源行原位移 → 最终预览位」，
 * 故 from = 原 body 索引、to = 预览序中被拖行最终索引，直接复用引擎 reorderRows。
 * @param line - 落位行数据
 * @param event - 原生 drop 事件
 */
function onRowDrop(line: TableBodyLine, event: DragEvent) {
  const preview = previewKeys.value;
  const result = drag.drop(line.key, event);
  previewKeys.value = undefined;
  removeDragSnapshot();
  if (!result) return;
  const from = body.value.findIndex((item) => item.key === result.fromKey);
  // 有预览：提交最终预览位（含落在自身占位）；无预览：落在自身 = 无操作（from === to 引擎守卫）
  const to = preview
    ? preview.indexOf(result.fromKey)
    : body.value.findIndex((item) => item.key === result.toKey);
  if (from < 0 || to < 0) return;
  const payload = instance.reorderRows(from, to);
  if (payload) emit("drag-sort", payload);
}

/** 拖拽结束（含取消路径）：清理状态 + 预览序弹回引擎原序 + 移除离屏快照 */
function onRowDragEnd() {
  drag.end();
  previewKeys.value = undefined;
  removeDragSnapshot();
}

const scrollHeight = computed(() => (typeof heightRaw === "number" ? `${heightRaw}px` : heightRaw));
/** 表头 sticky 仅在组件内存在真实纵向滚动盒时生效（fill / virtual），普通模式不挂载，行为不变 */
const theadSticky = fill || virtualEnabled;
/** 滚动区样式：virtual 用固定 height；fill 交给 flex 分配（二者同传以 fill 优先） */
const scrollStyle = computed(() => {
  if (fill || !virtualEnabled) return undefined;
  return { height: scrollHeight.value, overflowY: "auto" as const };
});

// ---- 边框与条纹（正交模型）---------------------------------------------------
// 词汇与语义对齐 naive-ui data-table：bordered 仅控制外框，网格线由 single-* 独立开关，
// 属性间零耦合、零优先级规则；网格线全部落在单元格/table（#8 纪律），collapse/separate 均渲染。
const bordered = props.bordered ?? true;
const bottomBordered = props.bottomBordered ?? true;
const singleColumn = props.singleColumn ?? false;
const singleLine = props.singleLine ?? true;
const striped = props.striped ?? false;
/** 行分割线开关（single-column 关闭） */
const rowLinesOn = !singleColumn;
/** 列分割线开关（single-line 关闭；bordered 不隐含列线，全网格 = :single-line="false"） */
const columnLinesOn = !singleLine;
/** 表头/骨架 stickyClass 开关：仅列线抑制（条纹语义仅在表体行，按行奇偶在 TableBodyRow 收敛） */
const stickyOpts = { columnLines: columnLinesOn };

/** sticky 表头普通列类：不透明底防行内容透出；分隔线归 th（thead 行级 border 会随行滚走）；
 * z-20 高于表体 fixed 列（--z-sticky: 10），纵向滚动行滑过表头时不穿透；
 * 表头 fixed 列的 z 由 stickyStyle inline style（var(--z-sticky-head)）提供，inline 优先级天然覆盖此处 class */
const theadThClass = theadSticky ? "sticky top-0 z-20 bg-background" : "";
/** 表头底线恒挂 th：两种边框模型均渲染（thead 行级 border 已退役）；不受任何开关作用——
 * 表头/表体分隔线是可读性硬底线，与行分割线（single-column）语义无关 */
const theadLineClass = "border-b border-border";
/** sticky 态 table 改分离边框：preflight 为 border-collapse: collapse，
 * 折叠边框几何归属 table，Chrome 下 sticky th 粘住后自身 border-b 渲染丢失；
 * separate + spacing-0 恢复单元格边框。普通模式保持 collapse，零回归。
 * 外框（bordered）与底线（非 bordered 且 bottom-bordered）画在 table 元素，两种边框模型均渲染。 */
const tableClass = [
  theadSticky ? "border-separate border-spacing-0" : "",
  bordered ? "border border-border" : "",
  !bordered && bottomBordered ? "border-b border-border" : "",
];

const scrollEl = ref<HTMLElement | null>(null);
/** 滚动容器内 thead 占据的前缀高度（scrollMargin）：由 TableHeader 测量回传，父层只写不清零 */
const theadOffset = ref(0);

// 仅 virtual: true 且 height 就绪时创建（配置 setup 期定版，顶层条件分支可安全注册生命周期）
const virtualizerRef = virtualEnabled
  ? useVirtualizer(
      computed(() => ({
        count: rows.value.length, // 翻页/重载后行窗口变化 → options 更新（setOptions 自动生效）
        getScrollElement: () => scrollEl.value,
        estimateSize: () => 40,
        overscan: 8,
        getItemKey: (index: number) => rows.value[index]!.id, // 行 id 作为虚拟行 key
        scrollMargin: theadOffset.value, // thead 在滚动容器内的 offset 前缀
      })),
    )
  : null;

/**
 * 表头测量回传：virtual 启用时写入 scrollMargin；禁用时保持既有值（父层任何路径不清零）。
 * @param payload - 子组件测量的 thead 总高
 */
function onHeaderMeasure(payload: { theadOffset: number }) {
  if (virtualEnabled) theadOffset.value = payload.theadOffset;
}

/** 表头视图模型：必须为 computed（列显隐后子组件依赖 headerRows 引用变化重测） */
const headerModel = computed<TableHeaderViewModel>(() => ({
  headerRows: headerRows.value,
  stickyOf: stickyOf.value,
  stickyOpts,
  sort: instance.sort.value,
  theadSticky,
  columnLinesOn,
  theadThClass,
  theadLineClass,
  hasSelection: hasSelection.value,
  selectionType: selection.value.type,
  selectionWidth: selection.value.width,
  headerChecked: headerChecked.value,
  headerIndeterminate: headerIndeterminate.value,
  dragEnabled: dragEnabled.value,
  dragWidth,
  columnSettingsEntry: props.columnSettingsPlacement === "header" && showColumnSettings.value,
}));

/** 表头交互动作（父层提供，子组件纯调用） */
const headerActions: TableHeaderViewActions = {
  toggleAll: (checked) => onHeaderSelect(checked),
  sort: (key) => onSort(key),
  openColumnSettings: (event, columnKey) => columnSettings.openAt(event, columnKey),
  groupStickyStyle: (cell) => groupStickyStyle(cell),
};

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

/** 行高动态测量：measureElement 读 data-index 把实测高度写回（行内容高度可变，不假设固定行高）。
 * 行组件为函数 ref，拿到的是组件实例，需经 $el 取真实 tr。
 * @param node - 函数 ref 收到的行元素或组件实例
 */
function measureRow(node: Element | ComponentPublicInstance | null) {
  const el = node instanceof Element ? node : (node?.$el as Element | undefined);
  if (el instanceof Element) virtualizerRef?.value.measureElement(el);
}

function onSort(key: string) {
  instance.toggleSort(key);
  emit("sort-change", instance.sort.value);
}

function onPageIndex(pageIndex: number) {
  instance.setPageIndex(pageIndex);
  lastEmittedPage.pageIndex = pageIndex;
  emit("update:page-index", pageIndex);
}

function onPageSize(pageSize: number) {
  instance.setPageSize(pageSize);
  lastEmittedPage.pageSize = pageSize;
  emit("update:page-size", pageSize);
}

// ---- 受控模式（v-model）：page 投影 → update:* 通知 ---------------------------
// 仅 page-index/page-size 至少一方受控时安装；lastEmittedPage 去重——
// 动作路径已 emit 过的值不再重复发（受控回写/内部归位只通知「未通知过的」变化）
const pageControlled = () => props.pageIndex !== undefined || props.pageSize !== undefined;
const lastEmittedPage = {
  pageIndex: undefined as number | undefined,
  pageSize: undefined as number | undefined,
};

if (pageControlled()) {
  watch(
    () => [instance.page.pageIndex, instance.page.pageSize] as const,
    ([pageIndex, pageSize]) => {
      if (pageIndex !== lastEmittedPage.pageIndex) {
        lastEmittedPage.pageIndex = pageIndex;
        emit("update:page-index", pageIndex);
      }
      if (pageSize !== lastEmittedPage.pageSize) {
        lastEmittedPage.pageSize = pageSize;
        emit("update:page-size", pageSize);
      }
    },
  );
}

function onRowClick(record: DataRecord, index: number, event: MouseEvent) {
  emit("row-click", record, index, event);
}

function onRowDblclick(record: DataRecord, index: number, event: MouseEvent) {
  emit("row-dblclick", record, index, event);
}

function onRowContextmenu(record: DataRecord, index: number, event: MouseEvent) {
  emit("row-contextmenu", record, index, event);
}

function onCellClick(record: DataRecord, columnKey: string, index: number, event: MouseEvent) {
  emit("cell-click", record, columnKey, index, event);
}

defineExpose({
  table: instance.table,
  page: instance.page,
  // 不暴露 sort：与受控 sort prop 同名，实例上互相遮蔽（TS6 起 h()/mount 类型检查拒绝该组件）；
  // 排序状态经 sort-change 事件与 definition.sort 投影获取
  loading: instance.loading,
  error: instance.error,
  visibleKeys: instance.visibleKeys,
  setVisibleKeys: instance.setVisibleKeys,
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
  <div
    ref="rootEl"
    :class="cn('relative w-full', fill && 'flex h-full min-h-0 flex-col', $attrs.class)"
    v-bind="contextMenuBindings"
  >
    <!-- 顶栏（搜索表单 + 列设置文字入口）与列设置单例宿主（根级、滚动容器外） -->
    <TableToolbar
      :class="cn(fill && 'shrink-0')"
      :search="search"
      :searchable="search?.actions ? undefined : true"
      :show-search-area="showSearchArea"
      :show-column-settings="showToolbarColumnSettings"
      :visible-count="visibleColumns.length"
      :total-count="columns.length"
      @search="onSearch"
      @reset="onReset"
      @open-column-settings="columnSettings.openAt($event)"
    />
    <TableColumnSettings
      :open="columnSettings.open.value"
      :anchor-style="columnSettings.anchorStyle.value"
      :strategy="overlayStrategy"
      @update:open="(next: boolean) => (columnSettings.open.value = next)"
    >
      <ColumnSettingsPanel
        :columns="columns"
        :column-tree="columnsTree"
        :visible-keys="instance.visibleKeys.value"
        :default-visible-keys="instance.defaultVisibleKeys"
        :highlight-key="columnSettings.highlightKey.value"
        @update:visible-keys="instance.setVisibleKeys"
      />
    </TableColumnSettings>
    <TableContextMenu
      :open="contextMenuController.open.value"
      :items="contextMenuController.items.value"
      :anchor-style="contextMenuController.anchorStyle.value"
      :strategy="overlayStrategy"
      @update:open="(next: boolean) => (contextMenuController.open.value = next)"
      @select="contextMenuController.onSelect"
    />

    <!-- 滚动容器：横向滚动时 fixed 列 sticky 生效；virtual/fill 模式兼任纵向滚动（分页条不参与滚动） -->
    <div
      ref="scrollEl"
      :class="cn('overflow-x-auto', fill && 'min-h-0 flex-1 overflow-y-auto')"
      :style="scrollStyle"
    >
      <table
        class="w-full caption-bottom text-sm"
        :class="tableClass"
        :style="tableMinWidth > 0 ? { minWidth: `${tableMinWidth}px` } : undefined"
      >
        <TableHeader :model="headerModel" :actions="headerActions" @measure="onHeaderMeasure" />

        <tbody class="[&>tr:last-child>td]:border-b-0">
          <!-- 加载态：固定 5 行骨架；选择列一并占位；骨架不虚拟化；loading 判定优先 -->
          <template v-if="loading">
            <tr v-for="row in SKELETON_ROWS" :key="row" data-skeleton data-table-skeleton>
              <td
                v-if="hasSelection"
                class="p-2 text-center align-middle"
                :class="[
                  rowLinesOn ? 'border-b border-border' : '',
                  columnLinesOn ? 'border-r border-border' : '',
                  stickyClass(stickyOf, SELECTION_CELL, stickyOpts),
                ]"
                :style="stickyStyle(stickyOf, SELECTION_CELL, false)"
              >
                <Skeleton class="size-4" />
              </td>
              <td
                v-if="dragEnabled"
                class="p-1 text-center align-middle"
                :class="[
                  rowLinesOn ? 'border-b border-border' : '',
                  columnLinesOn ? 'border-r border-border' : '',
                  stickyClass(stickyOf, DRAG_CELL, stickyOpts),
                ]"
                :style="stickyStyle(stickyOf, DRAG_CELL, false)"
              >
                <Skeleton class="size-4" />
              </td>
              <td
                v-for="(column, colIndex) in visibleColumns"
                :key="column.key"
                class="p-2 align-middle"
                :class="[
                  rowLinesOn ? 'border-b border-border' : '',
                  columnLinesOn && colIndex < visibleColumns.length - 1
                    ? 'border-r border-border'
                    : '',
                  stickyClass(stickyOf, column.key, stickyOpts),
                ]"
                :style="[
                  { textAlign: column.align ?? 'center' },
                  stickyStyle(stickyOf, column.key, false),
                ]"
              >
                <Skeleton class="h-4 w-full" />
              </td>
            </tr>
          </template>

          <!-- 错误态：error 优先于正常数据；插槽可自定义（slot props { error, retry }） -->
          <template v-else-if="showError">
            <tr data-error data-table-error>
              <td :colspan="columnCount" class="p-8 text-center text-muted-foreground">
                <slot name="error" :error="loadError" :retry="retry">
                  <div class="flex flex-col items-center gap-3">
                    <p>{{ loadError?.message ?? "加载失败" }}</p>
                    <Button variant="outline" size="sm" @click="retry">重试</Button>
                  </div>
                </slot>
              </td>
            </tr>
          </template>

          <!-- 虚拟滚动：窗口行 + 前后占位行（总高撑开滚动区间；行高经 measureElement 动态测量） -->
          <template v-else-if="virtualEnabled">
            <tr aria-hidden="true" data-virtual-pad :style="{ height: `${padTop}px` }">
              <td :colspan="columnCount" class="border-0 p-0"></td>
            </tr>
            <TableBodyRow
              v-for="item in virtualLines"
              :key="item.line.key"
              :ref="measureRow"
              :data-index="item.row.index"
              :line="item.line"
              :class="striped && item.line.index % 2 === 1 ? 'bg-muted/30' : undefined"
              :row-lines="rowLinesOn"
              :column-lines="columnLinesOn"
              :striped="striped"
              :columns="visibleColumns"
              :selection="hasSelection ? selection.type : undefined"
              :selected="selectedKeys.has(item.line.key)"
              :sticky="stickyOf"
              :tree-indent="tree ? treeIndent : undefined"
              :drag-column="dragEnabled"
              :drag-disabled="rowDragDisabled(item.line)"
              :dragging="drag.draggingKey.value === item.line.key"
              @select="(checked: boolean) => onRowSelect(item.line, checked)"
              @row-click="onRowClick(item.line.record, item.line.index, $event)"
              @row-dblclick="onRowDblclick(item.line.record, item.line.index, $event)"
              @row-contextmenu="onRowContextmenu(item.line.record, item.line.index, $event)"
              @cell-click="
                (columnKey: string, event: MouseEvent) =>
                  onCellClick(item.line.record, columnKey, item.line.index, event)
              "
              @drag-start="onRowDragStart(item.line, $event)"
              @drag-over="onRowDragOver(item.line, $event)"
              @drop="onRowDrop(item.line, $event)"
              @drag-end="onRowDragEnd()"
            />
            <tr aria-hidden="true" data-virtual-pad :style="{ height: `${padBottom}px` }">
              <td :colspan="columnCount" class="border-0 p-0"></td>
            </tr>
          </template>

          <template v-else>
            <TableBodyRow
              v-for="line in displayBody"
              :key="line.key"
              :line="line"
              :class="striped && line.index % 2 === 1 ? 'bg-muted/30' : undefined"
              :row-lines="rowLinesOn"
              :column-lines="columnLinesOn"
              :striped="striped"
              :columns="visibleColumns"
              :selection="hasSelection ? selection.type : undefined"
              :selected="selectedKeys.has(line.key)"
              :sticky="stickyOf"
              :tree-indent="tree ? treeIndent : undefined"
              :drag-column="dragEnabled"
              :drag-disabled="rowDragDisabled(line)"
              :dragging="drag.draggingKey.value === line.key"
              @select="(checked: boolean) => onRowSelect(line, checked)"
              @row-click="onRowClick(line.record, line.index, $event)"
              @row-dblclick="onRowDblclick(line.record, line.index, $event)"
              @row-contextmenu="onRowContextmenu(line.record, line.index, $event)"
              @cell-click="
                (columnKey: string, event: MouseEvent) =>
                  onCellClick(line.record, columnKey, line.index, event)
              "
              @drag-start="onRowDragStart(line, $event)"
              @drag-over="onRowDragOver(line, $event)"
              @drop="onRowDrop(line, $event)"
              @drag-end="onRowDragEnd()"
            />
          </template>

          <!-- 空态：横跨全列的单单元格，不虚拟化；错误态优先 -->
          <tr v-if="!loading && !showError && body.length === 0" data-empty data-table-empty>
            <td :colspan="columnCount" class="p-8 text-center text-muted-foreground">
              <slot name="empty">{{ emptyText ?? "暂无数据" }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 手动接线（须经 onPageIndex/onPageSize 包装器保留受控去重）；size select 保持现状。
         分页条不再补 border-t——分隔线由 table 底线承担（bordered 外框 / bottom-bordered） -->
    <TablePagination
      v-if="showPaginationBar"
      :class="cn(fill && 'shrink-0')"
      :page-index="instance.page.pageIndex"
      :page-size="instance.page.pageSize"
      :page-size-opts="instance.page.pageSizeOpts"
      :total="instance.page.total"
      :show-size-select="true"
      @update:page-index="onPageIndex"
      @update:page-size="onPageSize"
    />
  </div>
</template>
