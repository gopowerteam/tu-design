import type { ColumnDef } from "@tanstack/vue-table";
import { onMounted, reactive, readonly, ref, shallowRef, toValue, watch } from "vue";
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

  const table = useVueTable({
    get data() {
      return rows.value;
    },
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
  };
}
