import type {
  DataRecord,
  TableColumnGroupOptions,
  TableColumnNode,
  TableColumnOptions,
} from "./types";

/**
 * 列节点工具：分组判别与叶子扁平化（多级表头支撑，R34）。
 *
 * 设计取向：叶子口径全局不变 —— 引擎（TanStack 列定义）、列显隐、sticky 偏移、
 * min-width 求和、体单元格矩阵全部继续消费「扁平叶子」，分组能力只叠加在
 * 表头渲染与列设置面板两处。故此处是唯一的结构归一入口。
 */

/**
 * 判别节点是否为分组（含 children）。
 * @param node - 列节点（叶子或分组）
 * @returns 该节点是否为分组
 */
export function isColumnGroup<T extends DataRecord>(
  node: TableColumnNode<T>,
): node is TableColumnGroupOptions<T> {
  return Array.isArray((node as TableColumnGroupOptions<T>).children);
}

/**
 * 扁平化列节点树为叶子列数组（深度优先，保持声明顺序）。
 * @param nodes - 列节点树
 * @returns 深度优先展开的叶子列数组（下游全部消费此层）
 */
export function flattenColumns<T extends DataRecord>(
  nodes: TableColumnNode<T>[],
): TableColumnOptions<T>[] {
  const leaves: TableColumnOptions<T>[] = [];
  const walk = (list: TableColumnNode<T>[]) => {
    for (const node of list) {
      if (isColumnGroup(node)) walk(node.children);
      else leaves.push(node);
    }
  };
  walk(nodes);
  return leaves;
}
