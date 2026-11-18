import {
  createExpandedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/vue-table";

/** 选择列在 sticky 映射中的哨兵键（选择列不在 columns 内，表头/表体单独渲染） */
export const SELECTION_CELL = "__selection__";

/** 拖拽把手列在 sticky 映射中的哨兵键（同选择列：不在 columns 内，表头/表体单独渲染） */
export const DRAG_CELL = "__drag__";

/** 布局容器与 TableRender 的跨包填充协议 key：provide(true) 声明容器内 TableRender 应填满、内部滚动、表头固定 */
export const PAGE_TABLE_FILL_KEY = "tu-design:page-table-fill";

/**
 * TanStack v9 特性装配（模块级静态，跨实例共享稳定引用）：行选择 + 排序 + 分页 + 树形展开。
 * row model 槽位须排在其前置特性之后（v9 tableFeatures 的校验规则）。
 */
export const TABLE_FEATURES = tableFeatures({
  rowSelectionFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowExpandingFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  expandedRowModel: createExpandedRowModel(),
});

/** 上表装配推导出的特性集类型：Row/Table/ColumnDef 的第一泛型参数 */
export type TableRenderFeatures = typeof TABLE_FEATURES;
