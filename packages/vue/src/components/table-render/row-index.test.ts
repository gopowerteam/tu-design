import { describe, expect, it } from "vite-plus/test";
import { scanRows, toRowId } from "./row-index";

interface Row extends Record<string, unknown> {
  id?: number | string | null;
  name?: string;
  children?: Row[];
  subs?: Row[];
}

describe("toRowId", () => {
  it("rowKey 有值且字段存在：返回 String(value)", () => {
    expect(toRowId({ id: 7 }, "id", 0)).toBe("7");
    expect(toRowId({ id: "abc" }, "id", 3)).toBe("abc");
  });

  it("rowKey 有值但字段为 null/undefined：退化为 index-N", () => {
    expect(toRowId({ id: null }, "id", 2)).toBe("index-2");
    expect(toRowId({}, "id", 5)).toBe("index-5");
  });

  it("rowKey 未配置（undefined/空串）：退化为 index-N", () => {
    expect(toRowId({ id: 7 }, undefined, 1)).toBe("index-1");
    expect(toRowId({ id: 7 }, "", 4)).toBe("index-4");
  });
});

describe("scanRows", () => {
  const rows: Row[] = [
    { id: 1, name: "a" },
    { id: 2, name: "b" },
  ];

  it("withIndex + withDuplicates 双关：空 Map + 空数组", () => {
    const result = scanRows(rows, "id", "children", { withIndex: false, withDuplicates: false });
    expect(result.index.size).toBe(0);
    expect(result.duplicates).toEqual([]);
  });

  it("仅 withIndex：建立索引但不查重", () => {
    const result = scanRows([...rows, { id: 1, name: "dup" }], "id", "children", {
      withIndex: true,
      withDuplicates: false,
    });
    expect([...result.index.keys()]).toEqual(["1", "2"]);
    expect(result.index.get("1")).toEqual({ id: 1, name: "dup" });
    expect(result.duplicates).toEqual([]);
  });

  it("仅 withDuplicates：查重但索引为空 Map", () => {
    const result = scanRows([...rows, { id: 2, name: "dup" }], "id", "children", {
      withIndex: false,
      withDuplicates: true,
    });
    expect(result.index.size).toBe(0);
    expect(result.duplicates).toEqual(["2"]);
  });

  it("双开：索引后写覆盖 + 重复按首次发现序去重", () => {
    const result = scanRows(
      [
        { id: 1, name: "a" },
        { id: 2, name: "b" },
        { id: 1, name: "a2" },
        { id: 2, name: "b2" },
        { id: 1, name: "a3" },
      ],
      "id",
      "children",
      { withIndex: true, withDuplicates: true },
    );
    expect(result.index.get("1")).toEqual({ id: 1, name: "a3" });
    expect(result.index.get("2")).toEqual({ id: 2, name: "b2" });
    expect(result.duplicates).toEqual(["1", "2"]);
  });

  it("缺 rowKey 记录：不入索引、不参与查重（不产生 index-N 键）", () => {
    const result = scanRows(
      [
        { id: null, name: "x" },
        { id: undefined, name: "y" },
        { id: 1, name: "a" },
      ],
      "id",
      "children",
      { withIndex: true, withDuplicates: true },
    );
    expect([...result.index.keys()]).toEqual(["1"]);
    expect(result.duplicates).toEqual([]);
  });

  it("自定义 childrenKey + 未配置 tree 时数据含 children 仍递归（子行参与索引/查重）", () => {
    const custom: Row[] = [
      {
        id: 1,
        name: "p",
        subs: [
          { id: 11, name: "c1" },
          { id: 12, name: "c2", subs: [{ id: 111, name: "g" }] },
        ],
      },
    ];
    const result = scanRows(custom, "id", "subs", { withIndex: true, withDuplicates: false });
    expect([...result.index.keys()]).toEqual(["1", "11", "12", "111"]);
    expect(result.index.get("111")).toEqual({ id: 111, name: "g" });

    // 默认 childrenKey 未配置（无 tree），但数据含 children 仍递归
    const plainTree: Row[] = [{ id: 1, name: "p", children: [{ id: 2, name: "c" }] }];
    const plain = scanRows(plainTree, "id", "children", { withIndex: true, withDuplicates: true });
    expect([...plain.index.keys()]).toEqual(["1", "2"]);
  });

  it("树形子行重复 id：命中子行 id 且顺序稳定（两次调用深相等）", () => {
    const tree: Row[] = [
      {
        id: 1,
        name: "p",
        children: [
          { id: 9, name: "c1" },
          { id: 9, name: "c2" },
        ],
      },
      { id: 1, name: "p2" },
    ];
    const options = { withIndex: true, withDuplicates: true };
    const first = scanRows(tree, "id", "children", options);
    const second = scanRows(tree, "id", "children", options);
    expect(first.duplicates).toEqual(["9", "1"]);
    expect(second.duplicates).toEqual(first.duplicates);
    expect(second.index.size).toBe(first.index.size);
  });

  it("跨调用无残留：不同批次互不影响", () => {
    const first = scanRows([{ id: 1 }, { id: 1 }], "id", "children", {
      withIndex: true,
      withDuplicates: true,
    });
    expect(first.duplicates).toEqual(["1"]);

    const second = scanRows([{ id: 1 }, { id: 2 }], "id", "children", {
      withIndex: true,
      withDuplicates: true,
    });
    expect(second.duplicates).toEqual([]);
    expect(second.index.size).toBe(2);
  });

  it("rowKey 未配置：withIndex 下为空 Map（无 index-N 键）、无重复", () => {
    const result = scanRows(rows, undefined, "children", { withIndex: true, withDuplicates: true });
    expect(result.index.size).toBe(0);
    expect(result.duplicates).toEqual([]);
  });
});
