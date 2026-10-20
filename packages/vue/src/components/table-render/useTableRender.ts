import type { ColumnDef, RowSelectionState } from "@tanstack/vue-table";
import { computed, onMounted, reactive, readonly, ref, shallowRef, toValue, watch } from "vue";
import type { Ref } from "vue";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from "@tanstack/vue-table";
import type {
  DataRecord,
  SortableOptions,
  TableRenderDefinition,
  TableSelectionOptions,
  UseTableRenderOptions,
} from "./types";

const DEFAULT_PAGE_SIZE_OPTS = [10, 20, 50, 100];

/** DEV 兜底提示：生产构建静默，只留可读的降级行为（R1–R7） */
function warn(message: string) {
  if (import.meta.env.DEV) console.warn(`[tu-design] <TableRender> ${message}`);
}

/**
 * 表格数据内核：TanStack 无头引擎组装 + 1-based 对外投影 + 实例动作。
 *
 * 状态真相源是 TanStack 引擎（pageIndex 为 0-based），
 * `page`/`sort` 是对外的 1-based 只读投影，由 watch 同步。
 */
export function useTableRender<T extends DataRecord>(
  options: UseTableRenderOptions<T>,
): TableRenderDefinition<T> {
  const columns = options.columns;
  // 传入 onLoad 即服务端模式：分页/排序交由数据源，引擎不做本地加工
  const serverMode = typeof options.onLoad === "function";

  if (columns.length === 0) warn("columns 为空，表格将没有表头。");
  if (serverMode && options.data !== undefined) {
    warn("onLoad 与 data 不能同时传入，已按 onLoad（服务端模式）处理。");
  }

  const page = reactive({
    pageIndex: 1,
    pageSize: options.pageSize ?? 10,
    total: 0,
    pageSizeOpts: options.pageSizeOpts ?? DEFAULT_PAGE_SIZE_OPTS,
  });
  // defaultSort：静态模式进 TanStack 初始 sorting，服务端模式进首载 sort 参数
  const defaults = columns.filter((column) => column.defaultSort !== undefined);
  if (defaults.length > 1) {
    warn(`多列 defaultSort 仅首列 "${defaults[0].key}" 生效，其余已忽略。`);
  }
  if (defaults[0] && defaults[0].sortable !== true) {
    warn(`列 "${defaults[0].key}" 的 defaultSort 需要同时开启 sortable，已忽略。`);
  }
  const sorted = defaults.find((column) => column.sortable === true);
  const sort = ref<SortableOptions | undefined>(
    sorted ? { key: sorted.key, direction: sorted.defaultSort! } : undefined,
  );
  const loading = ref(false);
  const rows = shallowRef<T[]>([]);

  // ---- 行选择（S 系列） ------------------------------------------------------
  // 字符串简写 → 对象（S2）
  const rawSelection = options.rowSelection;
  const selectionConfig: TableSelectionOptions<T> | undefined =
    rawSelection === undefined
      ? undefined
      : typeof rawSelection === "string"
        ? { type: rawSelection }
        : rawSelection;
  // rowKey 由 defineTable 配置或 TableRender setup 时回填（S1）；就绪前选择不可用
  const rowKey = ref(options.rowKey);
  const selectionEnabled = computed(() => selectionConfig !== undefined && !!rowKey.value);
  const selectedKeys = ref(new Set<string | number>()) as Ref<Set<string | number>>;
  const selectionRows = shallowRef<T[]>([]);
  /** key → 最近一次出现的行对象；跨页选中行由此返回快照（S6） */
  const selectionSnapshot = new Map<string, T>();
  /** 选中但当前数据中不存在的 key（reserveOnPageChange 语义，S12） */
  const dirtyKeys = new Set<string>();
  /** 受控选择状态：单一真相源，onRowSelectionChange 只通知不落盘（避免 setRowSelection 回环） */
  const rowSelectionState = ref<RowSelectionState>({});

  function selectionEmitSafe() {
    // 选择集变化 → 替换新 Set 触发依赖（S7）；rows 从快照解析（含跨页）
    const keys = new Set<string | number>();
    for (const key of Object.keys(rowSelectionState.value))
      if (rowSelectionState.value[key]) keys.add(key);
    selectedKeys.value = keys;
    selectionRows.value = [...keys].map(
      (key) => selectionSnapshot.get(String(key)) ?? ({ [rowKey.value!]: key } as T),
    );
  }

  /** 选中集写入的唯一入口：赋受控 state + 重建对外投影 */
  function applyRowSelection(next: RowSelectionState) {
    rowSelectionState.value = next;
    selectionEmitSafe();
  }

  /** 行主键 → TanStack row id；rowKey 缺失时退化为索引（仅非选择场景可达，S1） */
  function rowIdOf(record: T, index: number): string {
    const key = rowKey.value;
    const value = key ? record[key] : undefined;
    return value === undefined || value === null ? `index-${index}` : String(value);
  }

  /** 数据窗口变化时刷新快照中已存在 key 的行对象（S6：后写覆盖） */
  function refreshSnapshot() {
    const key = rowKey.value;
    if (!key) return;
    let collisionWarned = false;
    for (const record of rows.value) {
      const value = record[key];
      if (value === undefined || value === null) continue;
      const id = String(value);
      if (selectionSnapshot.has(id) && !collisionWarned && import.meta.env.DEV) {
        // S11：撞 key 属数据问题，只提示一次
        if (selectionSnapshot.get(id) !== record) {
          collisionWarned = true;
          warn(`rowKey "${key}" 存在重复值，行选择快照以后出现的记录为准。`);
        }
      }
      selectionSnapshot.set(id, record);
      dirtyKeys.delete(id);
    }
    // 选中行对象可能刚被刷新：重建投影
    if (selectedKeys.value.size > 0) selectionEmitSafe();
  }

  // ---- 引擎组装 -------------------------------------------------------------
  const table = useVueTable({
    get data() {
      return rows.value;
    },
    getRowId: (originalRow, index) => rowIdOf(originalRow, index),
    columns: columns.map<ColumnDef<T>>((column) => ({
      accessorKey: column.key,
      header: column.title,
      enableSorting: column.sortable === true,
    })),
    initialState: {
      sorting: sorted ? [{ id: sorted.key, desc: sorted.defaultSort === "desc" }] : [],
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: serverMode,
    manualSorting: serverMode,
    get state() {
      return { rowSelection: rowSelectionState.value };
    },
    enableRowSelection: selectionConfig?.selectable
      ? (row) => selectionConfig.selectable!(row.original)
      : selectionConfig !== undefined,
    enableMultiRowSelection: selectionConfig?.type !== "radio",
    onRowSelectionChange: (updater) => {
      const prev = rowSelectionState.value;
      const next = typeof updater === "function" ? updater(prev) : updater;
      // S4：radio 且 cancelable: false 时，解绑结果为空集则保持原状
      if (
        selectionConfig?.type === "radio" &&
        selectionConfig.cancelable === false &&
        !Object.keys(next).some((key) => next[key])
      ) {
        return;
      }
      applyRowSelection(next);
    },
  });

  watch(
    () => table.getState().pagination,
    (pagination) => {
      if (page.pageIndex === pagination.pageIndex + 1 && page.pageSize === pagination.pageSize)
        return;
      page.pageIndex = pagination.pageIndex + 1;
      page.pageSize = pagination.pageSize;
    },
    { immediate: true },
  );

  watch(
    () => table.getState().sorting,
    (sorting) => {
      const next: SortableOptions | undefined = sorting[0]
        ? { key: sorting[0].id, direction: sorting[0].desc ? "desc" : "asc" }
        : undefined;
      // 仅在语义发散时回写：toggleSort 已同步落值，等价对象回写会触发多余的重复加载
      if (sort.value?.key === next?.key && sort.value?.direction === next?.direction) return;
      sort.value = next;
    },
    { immediate: true },
  );

  // 静态数据源：ref/getter 会自动跟随；普通数组为快照，可用 reload() 重同步
  function syncData() {
    const data = toValue(options.data);
    if (data !== undefined && !Array.isArray(data)) {
      warn("data 必须是数组，已按空表处理。");
    }
    // 复制出新引用：就地修改同一个普通数组时 shallowRef 不会触发，行模型会停留在旧快照
    rows.value = Array.isArray(data) ? [...data] : [];
    page.total = rows.value.length;
  }

  watch(() => toValue(options.data), syncData, { immediate: true });

  function setPageIndex(pageIndex: number) {
    table.setPageIndex(Math.max(0, pageIndex - 1));
  }

  function setPageSize(pageSize: number) {
    table.setPageSize(pageSize);
    // TanStack 容量变更后停在最后一页（pageCount-1），R9 要求回到首页
    table.setPageIndex(0);
  }

  /** 排序三态：无 → asc → desc → 取消；非 sortable 列为空操作（R8） */
  function toggleSort(key: string) {
    if (!columns.some((column) => column.key === key && column.sortable === true)) return;

    const current = sort.value;
    const direction =
      current?.key !== key ? "asc" : current.direction === "asc" ? "desc" : undefined;

    // 服务端模式按新排序取数，必须先归位到首页（R8）
    if (serverMode && page.pageIndex !== 1) setPageIndex(1);
    // 同步落值：对外投影不能等 watcher（emit 需要立即读到新排序）
    sort.value = direction ? { key, direction } : undefined;
    table.setSorting(direction ? [{ id: key, desc: direction === "desc" }] : []);
  }

  // 服务端模式：请求序号守卫，乱序返回的旧响应直接丢弃（R6）
  let requestId = 0;

  async function load() {
    const id = ++requestId;
    loading.value = true;
    try {
      await options.onLoad?.({
        form: {},
        page: {
          pageIndex: page.pageIndex,
          pageSize: page.pageSize,
          total: page.total,
          pageSizeOpts: page.pageSizeOpts,
        },
        sort: sort.value,
        update: (data, total) => {
          if (id !== requestId) return;
          rows.value = Array.isArray(data) ? data : [];
          // total 缺省时保留旧值（R10）
          if (typeof total === "number") page.total = total;
        },
      });
    } catch (error) {
      if (id === requestId) console.error("[tu-design] <TableRender> onLoad 执行失败：", error);
    } finally {
      if (id === requestId) loading.value = false;
    }
  }

  // 服务端模式下分页/排序变化即重取数；同一 tick 内多次变更只触发一次
  watch(
    () => (serverMode ? [page.pageIndex, page.pageSize, sort.value] : null),
    () => {
      void load();
    },
  );

  onMounted(() => {
    if (serverMode && (options.autoLoad ?? true)) void load();
    // S1：rowKey 在 defineTable 阶段可能尚未就绪（聚合式由 TableRender 回填），挂载时终审
    if (selectionConfig && !rowKey.value) {
      warn("rowSelection 需要有效的 rowKey 字段，已禁用行选择。");
    }
  });

  function reload(resetPage = false) {
    if (serverMode) {
      // 归位由分页 watch 触发重载；页码本就为首页时直接重载（避免双请求）
      if (resetPage && page.pageIndex !== 1) setPageIndex(1);
      else void load();
      return;
    }
    if (resetPage) setPageIndex(1);
    syncData();
  }

  // ---- 行选择动作与联动（S 系列） -------------------------------------------

  /** 程序化设置选中集；不存在的 key 保留进入 dirtyKeys（S12）；不可选行被过滤（对齐 S5） */
  function setSelection(keys: Array<string | number>) {
    const next: RowSelectionState = {};
    for (const key of keys) {
      const row = selectionSnapshot.get(String(key));
      // 快照中存在的行按 selectable 谓词过滤；待定 key（尚无行对象）无法判定的不拦
      if (row && selectionConfig?.selectable && !selectionConfig.selectable(row)) continue;
      next[String(key)] = true;
      if (!row) dirtyKeys.add(String(key));
    }
    applyRowSelection(next);
  }

  function clearSelection() {
    applyRowSelection({});
  }

  function toggleRowSelected(key: string, checked: boolean) {
    // S4：radio 且 cancelable: false 时，交互解绑最后一个选中为空操作
    if (!checked && selectionConfig?.type === "radio" && selectionConfig.cancelable === false) {
      return;
    }
    if (!checked) {
      const { [key]: _removed, ...rest } = rowSelectionState.value;
      applyRowSelection(rest);
      return;
    }
    // radio：单选互斥（S4）；checkbox：累加
    const next =
      selectionConfig?.type === "radio"
        ? { [key]: true }
        : { ...rowSelectionState.value, [key]: true };
    applyRowSelection(next);
  }

  /** 拆分式装配口：TableRender setup 时回传组件 rowKey（S1） */
  function setRowKey(key: string | undefined) {
    if (rowKey.value === key) return;
    rowKey.value = key;
    // 聚合式下数据窗口早于 rowKey 就绪（pre-flush 先于子组件 setup），补建快照
    refreshSnapshot();
  }

  // 数据窗口变化（翻页或数据替换）：刷新快照；reserveOnPageChange: false 时清空选中（S6）
  watch([rows, () => page.pageIndex], () => {
    refreshSnapshot();
    if (selectionConfig && selectionConfig.reserveOnPageChange === false) clearSelection();
  });

  return {
    columns,
    table,
    page: readonly(page),
    sort: readonly(sort),
    loading: readonly(loading),
    reload,
    toggleSort,
    setPageIndex,
    setPageSize,
    selection: {
      get value(): T[] {
        return selectionRows.value;
      },
      get enabled(): boolean {
        return selectionEnabled.value;
      },
      get type(): "radio" | "checkbox" {
        return selectionConfig?.type ?? "checkbox";
      },
      get width(): number {
        return selectionConfig?.width ?? 48;
      },
    },
    selectedKeys: selectedKeys as Readonly<Ref<Set<string | number>>>,
    setSelection,
    clearSelection,
    toggleRowSelected,
    setRowKey,
  };
}
