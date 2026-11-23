import type { Ref } from "vue";
import { computed } from "vue";
import { isColumnGroup } from "./columns";
import type { TableColumnNode, TableColumnOptions } from "./types";

/** 面板行：全树扁平化（分组 / 叶子），并携带三态与折叠所需元数据 */
export interface ColumnPanelRow {
  node: TableColumnNode;
  depth: number;
  isGroup: boolean;
  /** 该节点覆盖的叶子 key（分组为子树全部） */
  leafKeys: string[];
  /** DFS 索引路径（如 "0-1"）：分组唯一键与折叠游标 */
  path: string;
  /** 分组 `g:${path}`；叶子 column.key */
  key: string;
  /** 勾选态：分组三态 / 叶子布尔 */
  state: boolean | "indeterminate";
  /** 是否允许切换（叶子为「最后一列可见」时禁止） */
  canToggle: boolean;
  /** 祖先分组路径（搜索命中叶子时用于保留祖先可见性） */
  ancestorPaths: string[];
}

/** useColumnSettingsPanel 入参 */
export interface UseColumnSettingsPanelOptions {
  /** 原始列节点树 getter（非可见剪枝：隐藏后仍可恢复） */
  tree: () => TableColumnNode[];
  /** 扁平叶子列（原序；selectAll/reset 的口径源） */
  columns: () => TableColumnOptions[];
  /** 当前可见 key（受控/非受控统一投影） */
  visibleKeys: Ref<readonly string[]>;
  /** 写回可见 key（引擎 normalize 的唯一入口） */
  setVisibleKeys: (keys: string[]) => void;
  /** 默认可见 key getter（重置基准；undefined = 未配置） */
  defaultVisibleKeys: () => string[] | undefined;
  /** 面板局部搜索词 */
  query: Ref<string>;
  /** 面板局部折叠集（分组 path） */
  collapsed: Ref<Set<string>>;
}

/** 面板模型：过滤/折叠投影后的行与计数、动作 */
export interface ColumnSettingsPanelModel {
  rows: Ref<ColumnPanelRow[]>;
  visibleCount: Ref<number>;
  totalCount: Ref<number>;
  allVisible: Ref<boolean>;
  hasDefault: Ref<boolean>;
  /** totalCount >= 6 才显示搜索 */
  showSearch: Ref<boolean>;
  emptyMatch: Ref<boolean>;
  toggleRow(row: ColumnPanelRow): void;
  toggleCollapsed(path: string): void;
  selectAll(): void;
  reset(): void;
}

/**
 * 列设置面板模型：树形行派生、搜索/折叠投影、三态与批量动作。
 *
 * 设计取向：本模块是纯逻辑（不依赖引擎），可见集读写全部经 options 回调，
 * 由宿主负责 normalize（最少一列钳制）与双事件通知。
 * @param options - 列树/可见集/局部状态依赖
 * @returns 面板行投影与动作集合
 */
export function useColumnSettingsPanel(
  options: UseColumnSettingsPanelOptions,
): ColumnSettingsPanelModel {
  /** 全树叶子 key（原序）：计数与全选口径 */
  const leafKeysInTree = computed<string[]>(() => {
    const keys: string[] = [];
    const walk = (nodes: TableColumnNode[]) => {
      for (const node of nodes) {
        if (isColumnGroup(node)) walk(node.children);
        else keys.push(node.key);
      }
    };
    walk(options.tree());
    return keys;
  });

  /** 全树行（未过滤/未折叠）：供投影与祖先匹配复用 */
  const allRows = computed<ColumnPanelRow[]>(() => {
    const visible = new Set(options.visibleKeys.value);
    const rows: ColumnPanelRow[] = [];

    const collectLeaves = (node: TableColumnNode): string[] =>
      isColumnGroup(node) ? node.children.flatMap(collectLeaves) : [node.key];

    const walk = (
      nodes: TableColumnNode[],
      depth: number,
      parentPath: string,
      ancestors: string[],
    ) => {
      nodes.forEach((node, index) => {
        const path = parentPath === "" ? `${index}` : `${parentPath}-${index}`;
        const isGroup = isColumnGroup(node);
        const leafKeys = collectLeaves(node);
        const visibleCount = leafKeys.filter((key) => visible.has(key)).length;
        const state: boolean | "indeterminate" = isGroup
          ? visibleCount === 0
            ? false
            : visibleCount === leafKeys.length
              ? true
              : "indeterminate"
          : visible.has(leafKeys[0]!);
        rows.push({
          node,
          depth,
          isGroup,
          leafKeys,
          path,
          key: isGroup ? `g:${path}` : leafKeys[0]!,
          state,
          canToggle: isGroup
            ? true
            : !(options.visibleKeys.value.length <= 1 && visible.has(leafKeys[0]!)),
          ancestorPaths: ancestors,
        });
        if (isGroup) walk(node.children, depth + 1, path, [...ancestors, path]);
      });
    };
    walk(options.tree(), 0, "", []);
    return rows;
  });

  /** 搜索命中的行集合（命中叶子保留祖先分组；hitGroup 则保留全子树） */
  const matchedPaths = computed<Set<string> | null>(() => {
    const raw = options.query.value.trim().toLowerCase();
    if (raw === "") return null;
    const matched = new Set<string>();
    for (const row of allRows.value) {
      if (
        !String(row.node.title ?? "")
          .toLowerCase()
          .includes(raw)
      )
        continue;
      matched.add(row.path); // 自身命中
      for (const ancestor of row.ancestorPaths) matched.add(ancestor); // 保留祖先
      if (row.isGroup) {
        // 分组命中：保留其全部后代，便于直接批量操作
        const prefix = `${row.path}-`;
        for (const candidate of allRows.value) {
          if (candidate.path.startsWith(prefix)) matched.add(candidate.path);
        }
      }
    }
    return matched;
  });

  /** 投影行：搜索过滤 → 折叠裁剪（分组折叠隐藏其后代） */
  const rows = computed<ColumnPanelRow[]>(() => {
    const matched = matchedPaths.value;
    const collapsed = options.collapsed.value;
    return allRows.value.filter((row) => {
      if (matched && !matched.has(row.path)) return false;
      return !row.ancestorPaths.some((ancestor) => collapsed.has(ancestor));
    });
  });

  const totalCount = computed(() => leafKeysInTree.value.length);
  const visibleCount = computed(() => {
    const visible = new Set(options.visibleKeys.value);
    return leafKeysInTree.value.filter((key) => visible.has(key)).length;
  });
  const allVisible = computed(
    () => totalCount.value > 0 && visibleCount.value === totalCount.value,
  );
  const hasDefault = computed(() => options.defaultVisibleKeys() !== undefined);
  const showSearch = computed(() => totalCount.value >= 6);
  const emptyMatch = computed(() => options.query.value.trim() !== "" && rows.value.length === 0);

  /**
   * 分组批量显隐：显示整组（按列原序合并）/ 隐藏整组（保留最后一枚可见叶子）
   * @param row - 分组行
   */
  function toggleGroup(row: ColumnPanelRow) {
    const leafSet = new Set(row.leafKeys);
    if (row.state !== true) {
      options.setVisibleKeys(
        options
          .columns()
          .map((column) => column.key)
          .filter((key) => options.visibleKeys.value.includes(key) || leafSet.has(key)),
      );
      return;
    }
    const remaining = options.visibleKeys.value.filter((key) => !leafSet.has(key));
    if (remaining.length === 0) {
      options.setVisibleKeys([row.leafKeys[row.leafKeys.length - 1]!]);
      return;
    }
    options.setVisibleKeys(remaining);
  }

  /**
   * 叶子单列切换（最少一列保护由 canToggle 前置）
   * @param row - 叶子行
   */
  function toggleLeaf(row: ColumnPanelRow) {
    if (!row.canToggle) return;
    const key = row.key;
    options.setVisibleKeys(
      options.visibleKeys.value.includes(key)
        ? options.visibleKeys.value.filter((k) => k !== key)
        : [...options.visibleKeys.value, key],
    );
  }

  /**
   * 行点击：分组批量显隐 / 叶子单列切换
   * @param row - 面板行
   */
  function toggleRow(row: ColumnPanelRow) {
    if (row.isGroup) toggleGroup(row);
    else toggleLeaf(row);
  }

  /**
   * 分组折叠游标（局部状态，不写 visibleKeys）
   * @param path - 分组 DFS 路径
   */
  function toggleCollapsed(path: string) {
    const next = new Set(options.collapsed.value);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    options.collapsed.value = next;
  }

  /** 全选：恢复全树叶子（原序） */
  function selectAll() {
    if (allVisible.value) return;
    options.setVisibleKeys([...leafKeysInTree.value]);
  }

  /** 重置：defaultVisibleKeys 为准，未配置 = 全部可见 */
  function reset() {
    options.setVisibleKeys(
      options.defaultVisibleKeys() ?? options.columns().map((column) => column.key),
    );
  }

  return {
    rows,
    visibleCount,
    totalCount,
    allVisible,
    hasDefault,
    showSearch,
    emptyMatch,
    toggleRow,
    toggleCollapsed,
    selectAll,
    reset,
  };
}
