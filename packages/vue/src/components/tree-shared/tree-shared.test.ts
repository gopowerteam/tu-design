import { describe, expect, it, vi } from "vite-plus/test";
import { createTreeMate, flatten, type TreeOption } from "./index";

// 三层测试树：
// a
// ├─ b
// └─ c
//    ├─ d
//    └─ e
const TREE: TreeOption[] = [
  {
    key: "a",
    label: "根",
    children: [
      { key: "b", label: "子一" },
      {
        key: "c",
        label: "子二",
        children: [
          { key: "d", label: "孙一" },
          { key: "e", label: "孙二" },
        ],
      },
    ],
  },
];

const LEAVES = ["b", "d", "e"];

describe("tree-shared（treemate 移植）", () => {
  it("flatten 按展开态输出可见节点序列", () => {
    const mate = createTreeMate(TREE);
    expect(flatten(mate.treeNodes, []).map((n) => n.key)).toEqual(["a"]);
    expect(flatten(mate.treeNodes, ["a"]).map((n) => n.key)).toEqual(["a", "b", "c"]);
    expect(flatten(mate.treeNodes, ["a", "c"]).map((n) => n.key)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "e",
    ]);
  });

  it("getCheckedKeys cascade=true checkStrategy=all 返回全选与半选", () => {
    const mate = createTreeMate(TREE);
    const full = mate.getCheckedKeys(LEAVES, { cascade: true, checkStrategy: "all" });
    expect([...full.checkedKeys].sort()).toEqual(["a", "b", "c", "d", "e"]);
    expect(full.indeterminateKeys).toEqual([]);

    const partial = mate.getCheckedKeys(["d"], { cascade: true, checkStrategy: "all" });
    expect(partial.checkedKeys).toEqual(["d"]);
    expect(partial.indeterminateKeys).toEqual(["c", "a"]);
  });

  it("checkStrategy=child 时值仅含叶子", () => {
    const mate = createTreeMate(TREE);
    const r = mate.getCheckedKeys(LEAVES, { cascade: true, checkStrategy: "child" });
    expect([...r.checkedKeys].sort()).toEqual(["b", "d", "e"]);
    expect(r.indeterminateKeys).toEqual(["a"]);
  });

  it("checkStrategy=parent 时值仅含父", () => {
    const mate = createTreeMate(TREE);
    const r = mate.getCheckedKeys(LEAVES, { cascade: true, checkStrategy: "parent" });
    expect(r.checkedKeys).toEqual(["a"]);
    expect(r.indeterminateKeys).toEqual([]);
  });

  it("check/uncheck 增量勾选返回新 MergedKeys", () => {
    const mate = createTreeMate(TREE);
    const checked = mate.check("d", ["b"], { cascade: true });
    expect([...checked.checkedKeys].sort()).toEqual(["b", "d"]);
    expect(checked.indeterminateKeys).toEqual(["c", "a"]);

    const unchecked = mate.uncheck("b", ["b", "c", "d", "e"], { cascade: true });
    expect([...unchecked.checkedKeys].sort()).toEqual(["c", "d", "e"]);
    expect(unchecked.indeterminateKeys).toEqual(["a"]);
  });

  it("getPath 返回 keyPath 自根至该节点", () => {
    const mate = createTreeMate(TREE);
    expect(mate.getPath("d").keyPath).toEqual(["a", "c", "d"]);
  });

  it("空 children 与重复 key 不抛错，isLeaf 与 children 并存时 dev 告警", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => createTreeMate([{ key: "x", children: [] }, { key: "x" }])).not.toThrow();
    expect(() =>
      createTreeMate([{ key: "y", isLeaf: true, children: [{ key: "z" }] }]),
    ).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
