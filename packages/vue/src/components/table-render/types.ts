import type { ColumnRender, ColumnRenders } from "./column-renders";
import type { Table as TanstackTable } from "@tanstack/vue-table";
import type { MaybeRefOrGetter, Ref } from "vue";

/** 任意数据行（表格是弱类型数据容器，行结构由调用方的 T 决定） */
export interface DataRecord {
  [key: string]: any;
}

/**
 * 列配置。
 *
 * 命名总纲（D10）：能力/性质用 `-able` 形容词（sortable/ellipsis），
 * 配置值用名词（title/align/width），无 `allow-*`。
 */
export interface TableColumnOptions<T extends DataRecord = DataRecord> {
  /** 列标识，同时作为默认取值字段 */
  key: string;
  title: string;
  align?: "left" | "center" | "right";
  width?: number | string;
  /** 自定义单元格渲染，取值链 render > formatter > record[key]（R17） */
  render?: (r: ColumnRenders<T>) => ColumnRender<T>;
  /** 纯数据格式化；render 存在时被忽略 */
  formatter?: (record: T) => string | number | Date | undefined;
  /** 超宽截断 + 原生 title 提示（R15） */
  ellipsis?: boolean;
  /** 是否可排序（能力开关） */
  sortable?: boolean;
  /** 初始排序方向；需 sortable: true，否则 DEV 警告并忽略（R7） */
  defaultSort?: "asc" | "desc";
}

export interface PageableOptions {
  /** 1-based 页码（对外 API 唯一口径） */
  pageIndex: number;
  pageSize: number;
  total: number;
  /** 只读：状态投影不允许调用方直接改写每页条数选项 */
  pageSizeOpts: readonly number[];
}

export interface SortableOptions {
  key: string;
  direction: "asc" | "desc";
}

/** onLoad 入参：数据协议与 x-render 同构，request 生态由调用方自理 */
export interface TableLoadParams<T extends DataRecord = DataRecord> {
  /** 搜索表单值，v1 恒 {}（二期接 FormRender） */
  form: DataRecord;
  page: PageableOptions;
  /** 无排序或已取消排序时为 undefined */
  sort?: SortableOptions;
  /** 回写数据；total 缺省时保留旧值（R10） */
  update: (data: T[], total?: number) => void;
}

/** defineTable 的声明式配置 */
export interface DefineTableOptions<T extends DataRecord = DataRecord> {
  columns: TableColumnOptions<T>[];
  /** 服务端模式数据源；与 data 二选一，onLoad 优先 */
  onLoad?: (params: TableLoadParams<T>) => void | Promise<unknown>;
  /** 静态模式数据源（本地分页/排序） */
  data?: T[];
  /** 是否在挂载后自动加载，默认 true；仅服务端模式生效 */
  autoLoad?: boolean;
  pageSize?: number;
  pageSizeOpts?: number[];
  /** 行选择：radio 单选 / checkbox 多选；字符串为简写（S2） */
  rowSelection?: "radio" | "checkbox" | TableSelectionOptions<T>;
  /** 行主键字段；rowSelection 启用且此值无效时禁用选择（S1） */
  rowKey?: string;
}

/** 行选择配置（S 系列） */
export interface TableSelectionOptions<T extends DataRecord = DataRecord> {
  type: "radio" | "checkbox";
  /** 选择列宽，默认 48 */
  width?: number;
  /** 行级可选过滤；false 的行选择控件置灰且被全选跳过（S5） */
  selectable?: (record: T) => boolean;
  /** radio 再点已选中行是否取消，默认 true（S4） */
  cancelable?: boolean;
  /** 翻页/重载后是否保留选中，默认 true（S6） */
  reserveOnPageChange?: boolean;
}

/** useTableRender 的入参：data 额外支持 ref/getter（拆分模式下 props 天然响应式） */
export interface UseTableRenderOptions<T extends DataRecord = DataRecord> extends Omit<
  DefineTableOptions<T>,
  "data"
> {
  data?: MaybeRefOrGetter<T[] | undefined>;
}

/** defineTable / useTableRender 的返回物：列配置 + 引擎实例 + 只读状态 + 实例动作 */
export interface TableRenderDefinition<T extends DataRecord = DataRecord> {
  columns: TableColumnOptions<T>[];
  /** TanStack 表格实例（逃逸舱口） */
  table: TanstackTable<T>;
  page: Readonly<PageableOptions>;
  sort: Readonly<{ value: SortableOptions | undefined }>;
  loading: Readonly<{ value: boolean }>;
  /** 重新加载；resetPage 为 true 时先回到第 1 页（R12） */
  reload: (resetPage?: boolean) => void;
  /** 排序三态切换：无 → asc → desc → 取消（R8） */
  toggleSort: (key: string) => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  /** 选中行快照（含跨页保留行；跨页行可能为过期数据，见 S6） */
  selection: Readonly<{
    value: T[];
    /** rowSelection 配置有效（含 rowKey 就绪）时为 true（S1） */
    enabled: boolean;
    type: "radio" | "checkbox";
    width: number;
  }>;
  /** 选中主键集合；每次选中集变化替换为新 Set（S7） */
  selectedKeys: Readonly<Ref<Set<string | number>>>;
  /** 程序化设置选中集；不存在的 key 保留（S12） */
  setSelection: (keys: Array<string | number>) => void;
  clearSelection: () => void;
  /** 行控件切换：checked 为 false 时移除（radio 受 cancelable 约束，S4） */
  toggleRowSelected: (key: string, checked: boolean) => void;
  /** 内部装配口：拆分式由 TableRender 在 setup 时回填 rowKey（S1） */
  setRowKey: (rowKey: string | undefined) => void;
}
