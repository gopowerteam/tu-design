import { describe, expect, it } from "vite-plus/test";
import { ensureRafClockGuard, RAF_DRIFT_THRESHOLD_MS, type ClockWindow } from "./rafClock";

/**
 * 假窗口:确定性手动驱动(performance.now 可控,rAF 不自动触发,
 * __tick 推进本地时钟并触发一帧,回调 ts = 本地时钟 + drift 模拟
 * 「wujie 把 rAF 换到宿主时间线」的混用拓扑)。
 * 注意:哨兵裁决发生在首个 rAF 回调,故须先 __tick() 再 await ensure()。
 */
function createFakeWindow(driftMs = 0): ClockWindow & {
  __tick(advanceMs?: number): void;
} {
  let now = 100_000; // 本地时钟任意起点
  let seq = 0;
  const pending = new Map<number, (ts: number) => void>();
  const win: ClockWindow = {
    performance: { now: () => now },
    requestAnimationFrame(cb) {
      pending.set(++seq, cb);
      return seq;
    },
  };
  return {
    ...win,
    __tick(advance = 16) {
      now += advance;
      const ts = now + driftMs;
      for (const cb of [...pending.values()]) cb(ts);
      pending.clear();
    },
  };
}

describe("ensureRafClockGuard(哨兵门控)", () => {
  it("干净时间线:首帧裁决后自恢复原引用,installed=false", async () => {
    const win = createFakeWindow(5); // 帧内抖动量级
    const original = win.requestAnimationFrame;
    const decision = ensureRafClockGuard(win);
    win.__tick(); // 驱动哨兵帧
    const handle = await decision;
    expect(handle.installed).toBe(false);
    expect(handle.driftMs).toBe(5);
    expect(win.requestAnimationFrame).toBe(original);
  });

  it("漂移时间线:armed,后续回调改传本地时钟(zag deltaMs 公式恢复一致)", async () => {
    const win = createFakeWindow(55978); // wujie 真机量级
    const decision = ensureRafClockGuard(win);
    win.__tick();
    const handle = await decision;
    expect(handle.installed).toBe(true);
    expect(handle.driftMs).toBe(55978);

    // zag Timer 同款公式:startMs 与 tick now 必须同源(差 ≤ 一帧)
    let received = Number.NaN;
    const t0 = win.performance.now();
    win.requestAnimationFrame((ts) => {
      received = ts;
    });
    win.__tick(16);
    expect(received - t0).toBeGreaterThanOrEqual(0);
    expect(received - t0).toBeLessThanOrEqual(16);
  });

  it("幂等:重复调用返回同一句柄,不二次包装", async () => {
    const win = createFakeWindow(55978);
    const d1 = ensureRafClockGuard(win);
    win.__tick();
    const h1 = await d1;
    const wrappedRef = win.requestAnimationFrame;
    const h2 = await ensureRafClockGuard(win);
    expect(h2).toBe(h1);
    expect(win.requestAnimationFrame).toBe(wrappedRef);
  });

  it("阈值边界:threshold−1 判干净 / threshold 判漂移(≥ 语义)", async () => {
    const cleanWin = createFakeWindow(RAF_DRIFT_THRESHOLD_MS - 1);
    const cleanDecision = ensureRafClockGuard(cleanWin);
    cleanWin.__tick();
    expect((await cleanDecision).installed).toBe(false);
    const armedWin = createFakeWindow(RAF_DRIFT_THRESHOLD_MS);
    const armedDecision = ensureRafClockGuard(armedWin);
    armedWin.__tick();
    expect((await armedDecision).installed).toBe(true);
  });

  it("restore():全局引用还原,in-flight 已排队回调仍被服务", async () => {
    const win = createFakeWindow(55978);
    const original = win.requestAnimationFrame;
    const decision = ensureRafClockGuard(win);
    win.__tick();
    const handle = await decision;
    // restore 前排队(经武装包装入列)
    let received = Number.NaN;
    const t0 = win.performance.now();
    win.requestAnimationFrame((ts) => {
      received = ts;
    });
    handle.restore();
    expect(win.requestAnimationFrame).toBe(original);
    win.__tick(16);
    // in-flight 回调经包装放行,武装语义保持(本地时钟)
    expect(received - t0).toBeGreaterThanOrEqual(0);
    expect(received - t0).toBeLessThanOrEqual(16);
  });

  it("真实 window 冒烟(happy-dom):调用即裁决,不抛错", async () => {
    const handle = await ensureRafClockGuard();
    expect(handle).toBeDefined();
  });
});
