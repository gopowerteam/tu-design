import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ref } from "vue";
import { useStickyLayout } from "./useStickyLayout";
import { DRAG_CELL, SELECTION_CELL } from "./constants";
import type { HeaderCell } from "./useTableHeaderModel";
import type { TableColumnOptions } from "./types";

interface Options {
  columns: TableColumnOptions[];
  hasSelection?: boolean;
  selectionWidth?: number;
  dragEnabled?: boolean;
  dragWidth?: number;
}

/** 按给定列集装配 useStickyLayout（visibleColumns 与 columns 同源） */
function setup(options: Options) {
  const columns = ref<TableColumnOptions[]>(options.columns);
  const visibleColumns = ref<TableColumnOptions[]>(options.columns);
  const hasSelection = ref(options.hasSelection ?? false);
  const selectionWidth = ref(options.selectionWidth ?? 48);
  const dragEnabled = ref(options.dragEnabled ?? false);
  const dragWidth = options.dragWidth ?? 32;
  const layout = useStickyLayout({
    visibleColumns,
    columns,
    hasSelection,
    selectionWidth,
    dragEnabled,
    dragWidth: () => dragWidth,
  });
  return { layout, visibleColumns, hasSelection, dragEnabled };
}

/** 构造分组表头单元格（仅所需的 leafKeys/key/node） */
function groupCell(leafKeys: string[], key = "g:0", title = "G"): HeaderCell {
  return {
    node: { title, children: [] },
    key,
    path: "0",
    depth: 0,
    colSpan: leafKeys.length,
    rowSpan: 1,
    isGroup: true,
    leafKeys,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useStickyLayout stickyOf", () => {
  it("fixed:left 双列：offset 依次 0 / 100", () => {
    const { layout } = setup({
      columns: [
        { key: "a", title: "A", fixed: "left", width: 100 },
        { key: "b", title: "B", fixed: "left", width: 120 },
      ],
    });
    expect(layout.stickyOf.value.get("a")).toEqual({ side: "left", offset: 0, edge: false });
    expect(layout.stickyOf.value.get("b")).toEqual({ side: "left", offset: 100, edge: true });
  });

  it("有选择列：首列 offset = selectionWidth", () => {
    const { layout } = setup({
      columns: [{ key: "a", title: "A", fixed: "left", width: 100 }],
      hasSelection: true,
      selectionWidth: 48,
    });
    expect(layout.stickyOf.value.get(SELECTION_CELL)?.offset).toBe(0);
    expect(layout.stickyOf.value.get("a")?.offset).toBe(48);
  });

  it("dragEnabled：把手列紧随选择列（offset=selectionWidth），业务列再累计 dragWidth", () => {
    const { layout } = setup({
      columns: [{ key: "a", title: "A", fixed: "left", width: 100 }],
      hasSelection: true,
      selectionWidth: 48,
      dragEnabled: true,
      dragWidth: 32,
    });
    expect(layout.stickyOf.value.get(DRAG_CELL)?.offset).toBe(48);
    expect(layout.stickyOf.value.get("a")?.offset).toBe(80);
  });

  it("fixed:right 从最右列反向累计", () => {
    const { layout } = setup({
      columns: [
        { key: "x", title: "X", fixed: "right", width: 60 },
        { key: "y", title: "Y", fixed: "right", width: 80 },
      ],
    });
    expect(layout.stickyOf.value.get("y")).toEqual({ side: "right", offset: 0, edge: false });
    expect(layout.stickyOf.value.get("x")).toEqual({ side: "right", offset: 80, edge: true });
  });

  it("tableMinWidth = Σ数字 width（含选择列 / 把手列；字符串与 0 不计）", () => {
    const { layout } = setup({
      columns: [
        { key: "a", title: "A", width: 100 },
        { key: "b", title: "B", width: "10rem" },
        { key: "c", title: "C", width: 0 },
        { key: "d", title: "D", width: 50 },
      ],
      hasSelection: true,
      selectionWidth: 48,
      dragEnabled: true,
      dragWidth: 32,
    });
    expect(layout.tableMinWidth.value).toBe(100 + 50 + 48 + 32);
  });
});

describe("useStickyLayout groupStickyStyle", () => {
  it("同侧连续固定：整格 sticky，偏移取首个可见叶子的 offset", () => {
    const { layout } = setup({
      columns: [
        { key: "a", title: "A", fixed: "left", width: 100 },
        { key: "b", title: "B", fixed: "left", width: 120 },
      ],
      hasSelection: true,
      selectionWidth: 48,
    });
    expect(layout.groupStickyStyle(groupCell(["a", "b"]))).toEqual({
      position: "sticky",
      left: "48px",
      zIndex: "var(--z-sticky-head)",
    });
  });

  it("混合侧：返回 undefined，且同一 cell.key 只警告一次", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { layout } = setup({
      columns: [
        { key: "a", title: "A", fixed: "left", width: 100 },
        { key: "b", title: "B", fixed: "right", width: 100 },
      ],
    });
    const cell = groupCell(["a", "b"], "g:0", "混合组");
    expect(layout.groupStickyStyle(cell)).toBeUndefined();
    expect(layout.groupStickyStyle(cell)).toBeUndefined();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("固定方向混合"));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("混合组"));
  });

  it("组内固定列不连续（夹普通列）：降级为 undefined 且不警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { layout } = setup({
      columns: [
        { key: "a", title: "A", fixed: "left", width: 100 },
        { key: "m", title: "M", width: 100 },
        { key: "b", title: "B", fixed: "left", width: 100 },
      ],
    });
    expect(layout.groupStickyStyle(groupCell(["a", "m", "b"]))).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });
});
