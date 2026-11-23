import type { Ref } from "vue";
import { computed } from "vue";
import { isColumnGroup } from "./columns";
import type { StickyClassOptions, StickyMap } from "./sticky";
import type { DataRecord, SortableOptions, TableColumnNode, TableColumnOptions } from "./types";
import type { StickyCellStyle } from "./useStickyLayout";

/** 可见表头树节点：按 visibleKeySet 剪枝后的结构（空分组已被剔除） */
export interface HeaderNodeView<T extends DataRecord = DataRecord> {
  node: TableColumnNode<T>;
  isGroup: boolean;
  /** DFS 索引路径（如 "0-1"）：分组单元格 key 的唯一来源，与 title 解耦 */
  path: string;
  children: HeaderNodeView<T>[];
}

/** 表头单元格：分组跨列、叶子下沉贴底 */
export interface HeaderCell<T extends DataRecord = DataRecord> {
  node: TableColumnNode<T>;
  /** Vue 列表 key：叶子用列 key，分组用 `g:${path}`（唯一稳定） */
  key: string;
  path: string;
  depth: number;
  colSpan: number;
  rowSpan: number;
  isGroup: boolean;
  /** 该单元格覆盖的可见叶子列 key（分组为子树全部，叶子为自身） */
  leafKeys: string[];
}

/** useTableHeaderModel 入参 */
export interface TableHeaderModelOptions<T extends DataRecord = DataRecord> {
  /** 原始列节点树 getter（definition.columnTree 缺省时调用方回退扁平列） */
  tree: () => TableColumnNode<T>[];
  /** 可见列 key 集（列显隐的唯一口径源） */
  visibleKeySet: Ref<Set<string>>;
}

/** useTableHeaderModel 返回物：可见表头树 + 深度 + 表头矩阵（同源派生） */
export interface TableHeaderModel<T extends DataRecord = DataRecord> {
  /** 剪枝后的可见表头树（maxDepth 与表头矩阵同源于此） */
  visibleHeaderTree: Ref<HeaderNodeView<T>[]>;
  /** 表头深度（可见树）：无分组时为 1 */
  maxDepth: Ref<number>;
  /** 表头矩阵：行 × 单元格 */
  headerRows: Ref<HeaderCell<T>[][]>;
}

/**
 * 按可见集递归构建表头树：分组子树可见叶子为 0 时整支剔除（与列显隐同口径）。
 * @param nodes - 列节点树（或其子树）
 * @param visibleKeySet - 可见列 key 集
 * @param parentPath - 父级 DFS 索引路径（根为 ""）
 * @returns 剪枝后的可见表头树
 */
function buildVisibleHeaderTree<T extends DataRecord>(
  nodes: TableColumnNode<T>[],
  visibleKeySet: Set<string>,
  parentPath: string,
): HeaderNodeView<T>[] {
  const views: HeaderNodeView<T>[] = [];
  nodes.forEach((node, index) => {
    const path = parentPath === "" ? `${index}` : `${parentPath}-${index}`;
    if (isColumnGroup(node)) {
      const children = buildVisibleHeaderTree(node.children, visibleKeySet, path);
      if (children.length > 0) views.push({ node, isGroup: true, path, children });
    } else if (visibleKeySet.has(node.key)) {
      views.push({ node, isGroup: false, path, children: [] });
    }
  });
  return views;
}

/**
 * 表头模型：可见表头树 → 深度 / 表头矩阵，单一派生源杜绝口径漂移。
 * @param options - 列节点树 getter 与可见列 key 集
 * @returns 可见表头树、最大深度与表头矩阵
 */
export function useTableHeaderModel<T extends DataRecord = DataRecord>(
  options: TableHeaderModelOptions<T>,
): TableHeaderModel<T> {
  /** 唯一派生源：可见表头树 */
  const visibleHeaderTree = computed<HeaderNodeView<T>[]>(() =>
    buildVisibleHeaderTree(options.tree(), options.visibleKeySet.value, ""),
  );

  /** 表头深度（可见树）：无分组时为 1 */
  const maxDepth = computed(() => {
    const depthOf = (view: HeaderNodeView<T>): number =>
      view.children.length > 0 ? 1 + Math.max(...view.children.map(depthOf)) : 1;
    return visibleHeaderTree.value.length > 0
      ? Math.max(...visibleHeaderTree.value.map(depthOf))
      : 1;
  });

  /** 表头矩阵：叶子 rowSpan = maxDepth - depth，分组 colSpan = 子树可见叶子数 */
  const headerRows = computed<HeaderCell<T>[][]>(() => {
    const rows: HeaderCell<T>[][] = Array.from({ length: maxDepth.value }, () => []);
    const collectLeaves = (view: HeaderNodeView<T>): string[] =>
      view.isGroup
        ? view.children.flatMap(collectLeaves)
        : [(view.node as TableColumnOptions<T>).key];

    const walk = (views: HeaderNodeView<T>[], depth: number) => {
      for (const view of views) {
        const leafKeys = collectLeaves(view);
        if (view.isGroup) {
          rows[depth]!.push({
            node: view.node,
            key: `g:${view.path}`,
            path: view.path,
            depth,
            colSpan: leafKeys.length,
            rowSpan: 1,
            isGroup: true,
            leafKeys,
          });
        } else {
          rows[depth]!.push({
            node: view.node,
            key: (view.node as TableColumnOptions<T>).key,
            path: view.path,
            depth,
            colSpan: 1,
            rowSpan: maxDepth.value - depth,
            isGroup: false,
            leafKeys,
          });
        }
        walk(view.children, depth + 1);
      }
    };
    walk(visibleHeaderTree.value, 0);
    return rows;
  });

  return { visibleHeaderTree, maxDepth, headerRows };
}

/** TableHeader 视图模型：父层组装（必须为 computed），子组件纯消费 */
export interface TableHeaderViewModel {
  /** 行 × 单元格矩阵（与 useTableHeaderModel.headerRows 同口径） */
  headerRows: HeaderCell[][];
  stickyOf: StickyMap;
  stickyOpts: StickyClassOptions;
  sort: SortableOptions | undefined;
  theadSticky: boolean;
  columnLinesOn: boolean;
  theadThClass: string | string[];
  theadLineClass: string | string[];
  hasSelection: boolean;
  selectionType: "radio" | "checkbox";
  selectionWidth: number;
  headerChecked: boolean;
  headerIndeterminate: boolean;
  dragEnabled: boolean;
  dragWidth: number;
  /** placement === "header" && columnSettings 开启：叶子表头渲染 ⋮ */
  columnSettingsEntry: boolean;
}

/** TableHeader 动作：排序 / 全选 / 表头入口 / 分组 sticky（父层提供） */
export interface TableHeaderViewActions {
  toggleAll(checked: boolean): void;
  sort(key: string): void;
  openColumnSettings(event: MouseEvent, columnKey: string): void;
  groupStickyStyle(cell: HeaderCell): StickyCellStyle | undefined;
}
