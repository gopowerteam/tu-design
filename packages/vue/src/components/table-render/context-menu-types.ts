import type { DataRecord, TableColumnNode, TableColumnOptions } from "./types";

/** 右键目标判别联合（九态：table/empty/error/skeleton/pagination/header(叶/组)/row/cell） */
export type TableContextTarget<T extends DataRecord = DataRecord> =
  | { kind: "table" | "empty" | "error" | "skeleton" | "pagination" }
  | { kind: "header"; columnKey?: string; groupPath?: string; node: TableColumnNode<T> }
  | { kind: "row"; record: T; index: number; rowKey: string }
  | {
      kind: "cell";
      record: T;
      index: number;
      rowKey: string;
      columnKey: string;
      rawValue: unknown;
    };

/** 菜单项 onSelect 与业务 handler 共用的上下文 */
export interface TableContextMenuContext<T extends DataRecord = DataRecord> {
  target: TableContextTarget<T>;
  event: MouseEvent;
  selection: { keys: string[]; rows: T[] };
  visibleKeys: readonly string[];
  columns: readonly TableColumnOptions<T>[];
  /** 关闭菜单（内部先关后执行 onSelect） */
  close: () => void;
}

/** 业务可返回的菜单项（对齐 DropdownMenu MenuItemOption，item 必带 value） */
export type TableMenuItem<T extends DataRecord = DataRecord> =
  | {
      type?: "item";
      value: string;
      label: string;
      disabled?: boolean;
      onSelect?: (ctx: TableContextMenuContext<T>) => void | Promise<void>;
    }
  | { type: "label"; label: string }
  | { type: "separator" }
  | { type: "group"; label?: string; children: TableMenuItem<T>[] };

/** 默认菜单项构建依赖（显隐相关动作） */
export interface DefaultTableMenuOptions {
  columnSettingsEnabled: boolean;
  hasDefaultVisibleKeys: boolean;
  openColumnSettings: () => void;
  resetColumns: () => void;
  showAllColumns: () => void;
}

/**
 * 默认右键菜单项：列设置… / 重置列（仅配置了 defaultVisibleKeys）/ 显示全部列。
 * 每个动作都先关闭菜单再执行（协议③）；columnSettings 关闭时过滤全部列相关项。
 * @param ctx - 右键上下文
 * @param options - 显隐能力与动作
 * @returns 菜单项列表（可能为空）
 */
export function defaultTableMenuItems<T extends DataRecord = DataRecord>(
  ctx: TableContextMenuContext<T>,
  options: DefaultTableMenuOptions,
): TableMenuItem<T>[] {
  if (!options.columnSettingsEnabled) return [];
  const items: TableMenuItem<T>[] = [
    {
      value: "column-settings",
      label: "列设置…",
      onSelect: () => {
        ctx.close();
        options.openColumnSettings();
      },
    },
  ];
  if (options.hasDefaultVisibleKeys) {
    items.push({
      value: "reset-columns",
      label: "重置列",
      onSelect: () => {
        ctx.close();
        options.resetColumns();
      },
    });
  }
  items.push({
    value: "show-all-columns",
    label: "显示全部列",
    onSelect: () => {
      ctx.close();
      options.showAllColumns();
    },
  });
  return items;
}
