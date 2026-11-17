import { describe, expect, it, vi } from "vite-plus/test";
import { useRowDrag } from "./useRowDrag";

/** happy-dom 的 DragEvent 是 Event 别名（无 dataTransfer）：直接用普通 Event 构造 */
function dragEvent(type: string): DragEvent {
  return new Event(type, { cancelable: true }) as DragEvent;
}

describe("useRowDrag", () => {
  it("start 记录源行 key；over 接收目标行并 preventDefault", () => {
    const drag = useRowDrag();
    drag.start("a", dragEvent("dragstart"));
    expect(drag.draggingKey.value).toBe("a");

    const over = dragEvent("dragover");
    expect(drag.over("b", over)).toBe(true);
    expect(over.defaultPrevented).toBe(true);
  });

  it("无起拖状态时 over 不接收（不 preventDefault）", () => {
    const drag = useRowDrag();
    const over = dragEvent("dragover");
    expect(drag.over("b", over)).toBe(false);
    expect(over.defaultPrevented).toBe(false);
  });

  it("同源行 over 返回 false 但仍 preventDefault（占位 drop 的真实浏览器前提）", () => {
    const drag = useRowDrag();
    drag.start("a", dragEvent("dragstart"));
    const over = dragEvent("dragover");
    expect(drag.over("a", over)).toBe(false);
    expect(over.defaultPrevented).toBe(true);
    expect(drag.drop("a", dragEvent("drop"))).toEqual({ fromKey: "a", toKey: "a" });
  });

  it("drop 返回源/目标 key 并清理状态", () => {
    const drag = useRowDrag();
    drag.start("a", dragEvent("dragstart"));
    drag.over("c", dragEvent("dragover"));
    const drop = dragEvent("drop");
    expect(drag.drop("c", drop)).toEqual({ fromKey: "a", toKey: "c" });
    expect(drop.defaultPrevented).toBe(true);
    expect(drag.draggingKey.value).toBeUndefined();
  });

  it("end（取消路径）仅清理状态，不产生落位结果", () => {
    const drag = useRowDrag();
    drag.start("a", dragEvent("dragstart"));
    drag.over("b", dragEvent("dragover"));
    drag.end();
    expect(drag.draggingKey.value).toBeUndefined();
    expect(drag.drop("b", dragEvent("drop"))).toBeUndefined();
  });

  it("dataTransfer 存在时写入 effectAllowed/setData/dropEffect（Firefox 兼容）", () => {
    const drag = useRowDrag();
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };
    const start = dragEvent("dragstart");
    Object.defineProperty(start, "dataTransfer", { value: dataTransfer });
    drag.start("a", start);
    expect(dataTransfer.effectAllowed).toBe("move");
    expect(dataTransfer.setData).toHaveBeenCalledWith("text/plain", "a");
    expect(dataTransfer.setDragImage).not.toHaveBeenCalled();

    const over = dragEvent("dragover");
    Object.defineProperty(over, "dataTransfer", { value: dataTransfer });
    drag.over("b", over);
    expect(dataTransfer.dropEffect).toBe("move");
  });

  it("提供快照时 setDragImage 使用传入元素与偏移", () => {
    const drag = useRowDrag();
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      setDragImage: vi.fn(),
    };
    const start = dragEvent("dragstart");
    Object.defineProperty(start, "dataTransfer", { value: dataTransfer });
    const el = document.createElement("table");
    drag.start("a", start, { el, offsetX: 20, offsetY: 18 });
    expect(dataTransfer.setDragImage).toHaveBeenCalledWith(el, 20, 18);
  });
});
