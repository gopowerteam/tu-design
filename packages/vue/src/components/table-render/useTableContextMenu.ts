import type { Ref } from "vue";
import { ref, shallowRef } from "vue";
import type { MenuItemOption } from "../dropdown-menu/types";
import { defaultTableMenuItems } from "./context-menu-types";
import type {
  DefaultTableMenuOptions,
  TableContextMenuContext,
  TableContextTarget,
  TableMenuItem,
} from "./context-menu-types";
import type { DataRecord, TableColumnGroupOptions, TableColumnOptions } from "./types";

/** resolver 元数据：HTML data-* → 领域对象（父层注入当前页/列树查询） */
export interface ContextTargetMeta<T extends DataRecord = DataRecord> {
  rowOf: (rowKey: string) => { record: T; index: number } | undefined;
  columnOf: (columnKey: string) => TableColumnOptions<T> | undefined;
  groupOf: (groupPath: string) => TableColumnGroupOptions<T> | undefined;
}

/** 不接管的元素（表单内 / 显式豁免 / 菜单自身） */
const EXCLUDED_SELECTOR =
  'input, textarea, select, [contenteditable], [data-no-table-menu], [data-scope="menu"]';

/**
 * 解析右键目标（九态判别）。返回 undefined 表示不接管（协议⑥）。
 * @param event - contextmenu 事件
 * @param meta - data-* 到领域对象的查询器
 * @returns 目标描述；不接管时 undefined
 */
export function resolveTableContextTarget<T extends DataRecord = DataRecord>(
  event: MouseEvent,
  meta: ContextTargetMeta<T>,
): TableContextTarget<T> | undefined {
  if (event.defaultPrevented) return undefined;
  const raw = event.target;
  if (!(raw instanceof Element)) return undefined;
  if (raw.closest(EXCLUDED_SELECTOR)) return undefined;

  const rowEl = raw.closest("[data-row-key]");
  if (rowEl) {
    const rowKey = rowEl.getAttribute("data-row-key");
    const found = rowKey === null ? undefined : meta.rowOf(rowKey);
    if (rowKey !== null && found) {
      const cellEl = raw.closest("[data-column-key]");
      if (cellEl) {
        const columnKey = cellEl.getAttribute("data-column-key");
        if (columnKey !== null) {
          return {
            kind: "cell",
            record: found.record,
            index: found.index,
            rowKey,
            columnKey,
            rawValue: (found.record as Record<string, unknown>)[columnKey],
          };
        }
      }
      return { kind: "row", record: found.record, index: found.index, rowKey };
    }
  }

  const groupEl = raw.closest("th[data-column-group]");
  if (groupEl) {
    const groupPath = groupEl.getAttribute("data-column-group");
    const node = groupPath === null ? undefined : meta.groupOf(groupPath);
    if (groupPath !== null && node) return { kind: "header", groupPath, node };
  }
  const headerCell = raw.closest("th[data-column-key]");
  if (headerCell) {
    const columnKey = headerCell.getAttribute("data-column-key");
    const node = columnKey === null ? undefined : meta.columnOf(columnKey);
    if (columnKey !== null && node) return { kind: "header", columnKey, node };
  }

  if (raw.closest("[data-table-pagination]")) return { kind: "pagination" };
  if (raw.closest("[data-table-skeleton]")) return { kind: "skeleton" };
  if (raw.closest("[data-table-error]")) return { kind: "error" };
  if (raw.closest("[data-table-empty]")) return { kind: "empty" };
  if (raw.closest("table")) return { kind: "table" };
  return { kind: "table" };
}

/** useTableContextMenu 入参 */
export interface UseTableContextMenuOptions<T extends DataRecord = DataRecord> {
  /** 菜单配置：false 关闭；true 用默认项；函数返回业务项 */
  menu: () => boolean | ((ctx: TableContextMenuContext<T>) => TableMenuItem<T>[]);
  snapshot: () => Pick<TableContextMenuContext<T>, "selection" | "visibleKeys" | "columns">;
  defaults: () => DefaultTableMenuOptions;
  meta: () => ContextTargetMeta<T>;
  /** 无 onSelect 的菜单项点击回调（宿主 emit context-menu-select） */
  onMenuSelect?: (value: string, ctx: TableContextMenuContext<T>) => void;
  /** 菜单打开回调（宿主 emit context-menu） */
  onOpen?: (ctx: TableContextMenuContext<T>) => void;
}

/** 右键菜单控制器 */
export interface TableContextMenuController<T extends DataRecord = DataRecord> {
  open: Ref<boolean>;
  anchorStyle: Ref<Record<string, string>>;
  items: Ref<MenuItemOption[]>;
  context: Ref<TableContextMenuContext<T> | undefined>;
  onContextMenu(event: MouseEvent): boolean;
  onSelect(value: string): void;
  close(): void;
}

/**
 * 把业务菜单项转换为 DropdownMenu 描述，并收集 value → onSelect 映射。
 * @param items - 业务菜单项
 * @param handlers - 输出映射（value → onSelect）
 * @returns DropdownMenu 菜单项
 */
function toMenuOptions<T extends DataRecord>(
  items: TableMenuItem<T>[],
  handlers: Map<string, (ctx: TableContextMenuContext<T>) => void | Promise<void>>,
): MenuItemOption[] {
  return items.map((item) => {
    if (item.type === "separator") return { type: "separator" };
    if (item.type === "label") return { type: "label", label: item.label };
    if (item.type === "group") {
      return {
        type: "group",
        label: item.label,
        children: toMenuOptions(item.children, handlers),
      };
    }
    if (item.onSelect) handlers.set(item.value, item.onSelect);
    return {
      type: "item",
      value: item.value,
      label: item.label,
      disabled: item.disabled,
    };
  });
}

/**
 * 右键菜单控制器：解析目标、构建菜单、先关后执行（协议③④⑤）。
 * @param options - 菜单配置/快照/默认项/元数据与宿主回调
 * @returns 开合状态、菜单项、上下文与动作
 */
export function useTableContextMenu<T extends DataRecord = DataRecord>(
  options: UseTableContextMenuOptions<T>,
): TableContextMenuController<T> {
  const open = ref(false);
  const anchorStyle = ref<Record<string, string>>({
    position: "fixed",
    width: "0",
    height: "0",
    left: "0px",
    top: "0px",
  });
  const items = ref<MenuItemOption[]>([]);
  const context = shallowRef<TableContextMenuContext<T> | undefined>(undefined);
  const handlers = new Map<string, (ctx: TableContextMenuContext<T>) => void | Promise<void>>();

  /** 关闭菜单（不清上下文，供先关后执行读取） */
  function close() {
    open.value = false;
  }

  /**
   * 处理根节点 contextmenu：目标/菜单项任一不成立则不接管。
   * @param event - contextmenu 事件
   * @returns 是否已接管并打开
   */
  function onContextMenu(event: MouseEvent): boolean {
    const target = resolveTableContextTarget(event, options.meta());
    if (!target) return false;
    const ctx: TableContextMenuContext<T> = {
      ...options.snapshot(),
      target,
      event,
      close,
    };
    context.value = ctx;
    const configured = options.menu();
    const rawItems =
      typeof configured === "function"
        ? configured(ctx)
        : configured
          ? defaultTableMenuItems(ctx, options.defaults())
          : [];
    if (rawItems.length === 0) {
      context.value = undefined;
      return false;
    }
    handlers.clear();
    items.value = toMenuOptions(rawItems, handlers);
    anchorStyle.value = {
      position: "fixed",
      width: "0",
      height: "0",
      left: `${Math.round(event.clientX)}px`,
      top: `${Math.round(event.clientY)}px`,
    };
    open.value = true;
    options.onOpen?.(ctx);
    return true;
  }

  /**
   * 菜单项选中：先关闭菜单，命中 onSelect 执行之，否则交给宿主回调。
   * @param value - 选中项 value
   */
  function onSelect(value: string) {
    const ctx = context.value;
    if (!ctx) return;
    close();
    const handler = handlers.get(value);
    if (handler) void handler(ctx);
    else options.onMenuSelect?.(value, ctx);
  }

  return { open, anchorStyle, items, context, onContextMenu, onSelect, close };
}
