import { useTableRender } from "./useTableRender";
import type { DataRecord, DefineTableOptions, TableRenderDefinition } from "./types";

/**
 * 聚合入口：单次调用完成「列定义 + 数据内核 + 分页排序状态 + 实例动作」。
 *
 * 返回值直接传给 `<TableRender :definition="def" />`；
 * 须在组件 setup 中调用（TanStack useVueTable 约束）。
 */
export function defineTable<T extends DataRecord>(
  config: DefineTableOptions<T>,
): TableRenderDefinition<T> {
  return useTableRender<T>(config);
}
