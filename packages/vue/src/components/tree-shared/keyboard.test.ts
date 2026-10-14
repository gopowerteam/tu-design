import { describe, expect, it } from "vite-plus/test";
import { createTreeMate, type TreeOption } from "./index";
import { nextActiveKey } from "./keyboard";

// 扁平序列：a → b → c(禁用) → d
const TREE: TreeOption[] = [
  { key: "a", label: "甲" },
  { key: "b", label: "乙" },
  { key: "c", label: "丙", disabled: true },
  { key: "d", label: "丁" },
];

const flattened = createTreeMate(TREE).treeNodes;

describe("keyboard.nextActiveKey", () => {
  it("ArrowDown 沿可见序列移动且跳过 disabled", () => {
    expect(nextActiveKey(flattened, null, "ArrowDown")).toBe("a");
    expect(nextActiveKey(flattened, "a", "ArrowDown")).toBe("b");
    expect(nextActiveKey(flattened, "b", "ArrowDown")).toBe("d"); // 跳过禁用的 c
  });

  it("末尾循环回首行，ArrowUp 反向亦跳过 disabled", () => {
    expect(nextActiveKey(flattened, "d", "ArrowDown")).toBe("a");
    expect(nextActiveKey(flattened, "a", "ArrowUp")).toBe("d");
    expect(nextActiveKey(flattened, "d", "ArrowUp")).toBe("b");
  });

  it("Home/End 定位首末可用节点", () => {
    expect(nextActiveKey(flattened, "b", "Home")).toBe("a");
    expect(nextActiveKey(flattened, "a", "End")).toBe("d");
  });
});
