import { describe, expect, it } from "vite-plus/test";
import { useHeaderMeasurement, HEADER_ROW_FALLBACK } from "./useHeaderMeasurement";

/** 以给定 offsetHeight 构造行元素桩（happy-dom 无布局，直接注入测量值） */
function rowStub(offsetHeight: number): HTMLElement {
  return { offsetHeight } as HTMLElement;
}

describe("useHeaderMeasurement", () => {
  it("兜底常量 HEADER_ROW_FALLBACK = 40", () => {
    expect(HEADER_ROW_FALLBACK).toBe(40);
  });

  it("[{48},{0},{32}] → rowTop [0,48,88]（0 高按 40 兜底），theadOffset 80（实测原值）", () => {
    const m = useHeaderMeasurement();
    m.rowEls.value = [rowStub(48), rowStub(0), rowStub(32)];
    m.measure();

    expect(m.rowTop.value).toEqual([0, 48, 88]);
    expect(m.theadOffset.value).toBe(80);
  });

  it("virtualEnabled: () => false → theadOffset 恒 0，rowTop 照算", () => {
    const m = useHeaderMeasurement({ virtualEnabled: () => false });
    m.rowEls.value = [rowStub(48), rowStub(32)];
    m.measure();

    expect(m.rowTop.value).toEqual([0, 48]);
    expect(m.theadOffset.value).toBe(0);
  });

  it("全 0 高 → rowTop [0,40,80]（逐行按兜底累计）", () => {
    const m = useHeaderMeasurement();
    m.rowEls.value = [rowStub(0), rowStub(0), rowStub(0)];
    m.measure();

    expect(m.rowTop.value).toEqual([0, 40, 80]);
  });

  it("空行集 → rowTop []，theadOffset 0", () => {
    const m = useHeaderMeasurement();
    m.measure();
    expect(m.rowTop.value).toEqual([]);
    expect(m.theadOffset.value).toBe(0);
  });
});
