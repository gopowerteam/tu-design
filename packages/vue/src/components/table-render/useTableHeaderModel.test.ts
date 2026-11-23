import { describe, expect, it } from "vite-plus/test";
import { ref } from "vue";
import { useTableHeaderModel } from "./useTableHeaderModel";
import type { TableColumnNode } from "./types";

/** 构造单级三列 */
function flatTree(): TableColumnNode[] {
  return [
    { key: "a", title: "A" },
    { key: "b", title: "B" },
    { key: "c", title: "C" },
  ];
}

/** 构造两级树：1 组（2 叶）+ 1 叶 */
function groupedTree(): TableColumnNode[] {
  return [
    {
      title: "G",
      children: [
        { key: "a", title: "A" },
        { key: "b", title: "B" },
      ],
    },
    { key: "c", title: "C" },
  ];
}

describe("useTableHeaderModel", () => {
  it("单级 3 列：1 行表头，叶子 rowSpan=1、colSpan=1，key 用列 key", () => {
    const tree = ref<TableColumnNode[]>(flatTree());
    const visibleKeySet = ref(new Set(["a", "b", "c"]));
    const model = useTableHeaderModel({ tree: () => tree.value, visibleKeySet });

    expect(model.maxDepth.value).toBe(1);
    expect(model.visibleHeaderTree.value).toHaveLength(3);
    expect(model.headerRows.value).toHaveLength(1);

    const row = model.headerRows.value[0]!;
    expect(row.map((cell) => cell.key)).toEqual(["a", "b", "c"]);
    expect(row.every((cell) => cell.rowSpan === 1 && cell.colSpan === 1)).toBe(true);
    expect(row.every((cell) => cell.isGroup === false)).toBe(true);
  });

  it("两级（1 组 2 叶 + 1 叶）：depth=2、组 colSpan=2/key `g:0`、叶 rowSpan=2", () => {
    const tree = ref<TableColumnNode[]>(groupedTree());
    const visibleKeySet = ref(new Set(["a", "b", "c"]));
    const model = useTableHeaderModel({ tree: () => tree.value, visibleKeySet });

    expect(model.maxDepth.value).toBe(2);
    expect(model.headerRows.value).toHaveLength(2);

    const [first, second] = model.headerRows.value;
    expect(first).toHaveLength(2);

    const group = first![0]!;
    expect(group.isGroup).toBe(true);
    expect(group.key).toBe("g:0");
    expect(group.path).toBe("0");
    expect(group.depth).toBe(0);
    expect(group.colSpan).toBe(2);
    expect(group.rowSpan).toBe(1);
    expect(group.leafKeys).toEqual(["a", "b"]);

    const leafC = first![1]!;
    expect(leafC.isGroup).toBe(false);
    expect(leafC.key).toBe("c");
    expect(leafC.depth).toBe(0);
    expect(leafC.colSpan).toBe(1);
    expect(leafC.rowSpan).toBe(2);

    expect(second!.map((cell) => cell.key)).toEqual(["a", "b"]);
    expect(second!.every((cell) => cell.depth === 1 && cell.rowSpan === 1)).toBe(true);
  });

  it("隐藏分组内全部叶子后整支剔除；剩余叶仍可见", () => {
    const tree = ref<TableColumnNode[]>(groupedTree());
    const visibleKeySet = ref(new Set(["c"]));
    const model = useTableHeaderModel({ tree: () => tree.value, visibleKeySet });

    expect(model.visibleHeaderTree.value.map((view) => view.path)).toEqual(["1"]);
    expect(model.maxDepth.value).toBe(1);
    expect(model.headerRows.value[0]!.map((cell) => cell.key)).toEqual(["c"]);
  });

  it("visibleKeySet 变更后重算：组内仅剩 1 叶时组 colSpan=1", () => {
    const tree = ref<TableColumnNode[]>(groupedTree());
    const visibleKeySet = ref(new Set(["a", "b", "c"]));
    const model = useTableHeaderModel({ tree: () => tree.value, visibleKeySet });
    expect(model.headerRows.value[0]![0]!.colSpan).toBe(2);

    visibleKeySet.value = new Set(["a", "c"]);
    const group = model.headerRows.value[0]![0]!;
    expect(group.key).toBe("g:0");
    expect(group.colSpan).toBe(1);
    expect(group.leafKeys).toEqual(["a"]);

    visibleKeySet.value = new Set<string>();
    expect(model.visibleHeaderTree.value).toHaveLength(0);
    expect(model.maxDepth.value).toBe(1);
  });
});
