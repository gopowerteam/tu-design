import type { MaybeRefOrGetter, Ref } from "vue";
import { computed, toValue } from "vue";
import { DRAG_CELL, SELECTION_CELL } from "./constants";
import type { StickyMap } from "./sticky";
import type { DataRecord, TableColumnGroupOptions, TableColumnOptions } from "./types";
import type { HeaderCell } from "./useTableHeaderModel";

/** 分组单元格的 sticky inline style（同侧连续固定时整格钉住） */
export interface StickyCellStyle {
  position: "sticky";
  left?: string;
  right?: string;
  zIndex: string;
}

/** useStickyLayout 入参：sticky 映射与 min-width 的全部依赖 */
export interface TableStickyLayoutOptions<T extends DataRecord = DataRecord> {
  /** 可见业务列（columns 原序子集） */
  visibleColumns: Ref<TableColumnOptions<T>[]>;
  /** 全量列（分组 sticky 按叶子 key 反查 fixed/width） */
  columns: Ref<TableColumnOptions<T>[]>;
  /** 是否渲染选择列 */
  hasSelection: Ref<boolean>;
  /** 选择列宽（选择列视作最左 fixed 列，offset 0） */
  selectionWidth: Ref<number>;
  /** 是否渲染拖拽把手列 */
  dragEnabled: Ref<boolean>;
  /** 把手列宽（数字 getter） */
  dragWidth: MaybeRefOrGetter<number>;
}

/** useStickyLayout 返回物 */
export interface TableStickyLayout<T extends DataRecord = DataRecord> {
  /** 列 key（含选择/把手哨兵）→ sticky 侧与偏移 */
  stickyOf: Ref<StickyMap>;
  /** <table> min-width 下限：可见业务列数字 width 之和（含选择列/把手列；0 不挂） */
  tableMinWidth: Ref<number>;
  /** 同侧连续固定 → 样式；混合/不连续 → undefined 且 DEV 警告一次（按 cell.key 去重） */
  groupStickyStyle(cell: HeaderCell<T>): StickyCellStyle | undefined;
}

/**
 * sticky 布局：sticky 单元格映射（纯渲染层，不进 TanStack pinning state）、
 * 表格 min-width 与分组表头单元格样式。
 * @param options - 可见列/全量列/选择列/把手列的响应式依赖
 * @returns sticky 映射、min-width 与分组 sticky 样式函数
 */
export function useStickyLayout<T extends DataRecord = DataRecord>(
  options: TableStickyLayoutOptions<T>,
): TableStickyLayout<T> {
  /** sticky 单元格映射：选择列视作最左 fixed 列参与累计（offset 0），
   * fixed-left 按列序累加，fixed-right 从最右列反向累计。
   * edge = 该 sticky 组朝滚动方向的交界列（加分隔边框）。
   * 全部基于**可见集**：sticky 组因隐藏变空则无该组输出（不输出边框）。
   */
  const stickyOf = computed<StickyMap>(() => {
    const map: StickyMap = new Map();
    // 联合上的 filter 类型谓词重载解析不可靠，故 map 提取时以断言收窄 width（条件已含 typeof 守卫）
    const lefts = options.visibleColumns.value
      .filter((column) => column.fixed === "left" && typeof column.width === "number")
      .map((column) => ({ key: column.key, width: column.width as number }));
    const rights = options.visibleColumns.value
      .filter((column) => column.fixed === "right" && typeof column.width === "number")
      .map((column) => ({ key: column.key, width: column.width as number }));

    let acc = 0;
    if (options.hasSelection.value) {
      map.set(SELECTION_CELL, {
        side: "left",
        offset: 0,
        edge: lefts.length === 0 && !options.dragEnabled.value,
      });
      acc = options.selectionWidth.value;
    }
    // 把手列紧随选择列（选择列保持 offset 0 视觉锚点），同视作最左固定列参与累计
    if (options.dragEnabled.value) {
      map.set(DRAG_CELL, { side: "left", offset: acc, edge: lefts.length === 0 });
      acc += toValue(options.dragWidth);
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

  /** 表格 min-width：可见业务列数字 width 之和（含选择列），字符串 width 不参与求和 */
  const tableMinWidth = computed(() => {
    let sum = 0;
    for (const column of options.visibleColumns.value) {
      if (typeof column.width === "number" && column.width > 0) sum += column.width;
    }
    if (options.hasSelection.value && options.selectionWidth.value > 0) {
      sum += options.selectionWidth.value;
    }
    const dragWidth = toValue(options.dragWidth);
    if (options.dragEnabled.value && dragWidth > 0) sum += dragWidth;
    return sum;
  });

  /** 混合固定组警告去重（同名分组仅警告一次） */
  const warnedMixedFixedGroups = new Set<string>();

  /**
   * 分组单元格的 sticky 样式：子树可见叶子同侧且连续固定时整格 sticky，
   * 偏移取首个可见叶子；混合侧 → 返回 undefined（降级普通格）并 DEV 警告一次。
   * @param cell - 表头单元格（分组）
   * @returns 分组单元格的 sticky inline style；不适用时返回 undefined
   */
  function groupStickyStyle(cell: HeaderCell<T>): StickyCellStyle | undefined {
    const sides = new Set(
      cell.leafKeys
        .map((key) => options.columns.value.find((column) => column.key === key)?.fixed)
        .filter((side): side is "left" | "right" => side !== undefined),
    );
    // 混合侧（同时含 left 与 right）：单元格无法部分固定 → 降级普通格
    if (sides.size > 1) {
      if (!warnedMixedFixedGroups.has(cell.key)) {
        warnedMixedFixedGroups.add(cell.key);
        if (import.meta.env.DEV) {
          console.warn(
            `[tu-design] <TableRender> 分组「${(cell.node as TableColumnGroupOptions<T>).title}」内固定方向混合，已降级为普通表头格。`,
          );
        }
      }
      return undefined;
    }
    if (sides.size === 0) return undefined;
    // 组内固定列不连续（中间夹普通列）时，分组格跨过非固定列会遮挡滚动内容 → 同样降级
    const fixedLeaves = cell.leafKeys.filter((key) => {
      const column = options.columns.value.find((c) => c.key === key);
      return column?.fixed !== undefined && typeof column.width === "number";
    });
    if (fixedLeaves.length !== cell.leafKeys.length) return undefined;
    const side = [...sides][0]!;
    const first = stickyOf.value.get(cell.leafKeys[0]!);
    if (!first) return undefined;
    return {
      position: "sticky" as const,
      [side]: `${first.offset}px`,
      zIndex: "var(--z-sticky-head)",
    };
  }

  return { stickyOf, tableMinWidth, groupStickyStyle };
}
