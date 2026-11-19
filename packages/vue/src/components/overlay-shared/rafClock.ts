/**
 * rAF 时钟守卫——「沙箱时钟混用」家族修复(issue #6)。
 *
 * 机制链(wujie 2.1.0 真机实证):
 * 1. wujie `windowRegWhiteList` 含 `/animationFrame$/i`,patchWindowEffect 把子应用
 *    iframe window 的 `requestAnimationFrame` 替换为宿主 rAF 的 bind 包装(own
 *    property,name 为 "bound requestAnimationFrame");`performance` 不在白名单,
 *    保持 iframe 本地 → 子应用内两时钟分属两条时间线,偏移 = 宿主加载→子应用
 *    打开间隔(秒~分钟级);
 * 2. `@zag-js/utils` 的 Timer(1.47.0/1.48.0 同构)混用两时钟:`start()` 取
 *    `performance.now()`(本地),`tick()` 取 rAF 回调时间戳(宿主)→
 *    `deltaMs ≈ 偏移 ≫ duration`,有限时长 toast 首 tick 即 DISMISS;
 *    loading/duration:Infinity 走 shouldPersist 直通不启计时器,故完全正常
 *    (与真机差分症状逐条吻合);
 * 3. 同族消费方:@zag-js/toast / clipboard / splitter / timer 四个机器,
 *    单点修复(本守卫)全部覆盖;
 * 4. 注:现代 Chrome 对「原始」同源 iframe 的 rAF 时间戳按 document 自身
 *    timeOrigin 相对化(whatwg/html#9823 后的规范),普通 iframe 嵌入无此 bug
 *    ——守卫 therefore 必须按运行时哨兵门控,不能按拓扑 mode 门控(否则普通
 *    iframe 下反而注入 duration+偏移 的反向 bug,真机实证 3000ms → 7044ms)。
 *
 * 归一化形态:回调时间戳整体改传本地 `performance.now()`(上游单时钟方案的
 * 应用层同构),不做 timeOrigin 偏移算术——不访问 `window.parent`,跨域沙箱
 * 免疫,无符号错误面;误差预算 ≤1 帧(zag Timer 仅做 `deltaMs >= delay`
 * 比较,不依赖同帧同值,影响可忽略)。
 *
 * 门控:哨兵 = 安装后首个 rAF 回调测 `|ts − performance.now()|`;正常环境帧内
 * 抖动 ≤16ms,阈值 100ms(≈6 帧)零误伤。zag 上游修复(tick 单时钟)落地后,
 * 哨兵测得漂移≈0,守卫自动休眠——可与上游修复安全共存,无需回改本文件。
 *
 * 时序:同步安装包装(setup 顶层调用,零空窗)→ 主动排一帧空回调做哨兵 →
 * 裁决:干净则恢复全局原引用(已排队的 in-flight 回调仍经包装无害放行),
 * 漂移则保持武装。裁决前(首帧内)回调原样放行(= 原生行为)。
 *
 * 已知边界:
 * - wujie 同白名单替换了 cancelAnimationFrame,宿主 rAF id 配宿主 cancel,
 *   链路自洽;「只换 rAF 不换 cancel」的沙箱 frameId 会失配,属该沙箱自身缺陷;
 * - `mode: "none"` 不安装(语义 B「显式关全部适配」,与 config.ts 纪律一致),
 *   该拓扑下若仍存在时钟混用由应用自担;
 * - 哨兵仅在安装时测量一次;偏移在 iframe 创建即固定(timeOrigin 差),
 *   会话内恒定,无需复测。
 */

/** 哨兵漂移阈值(ms):正常环境 rAF ts 与 performance.now() 同帧差 ≤1 帧(~16ms),留 6 帧余量 */
export const RAF_DRIFT_THRESHOLD_MS = 100;

/** 守卫裁决结果句柄 */
export interface RafClockGuardHandle {
  /** 哨兵是否命中(安装归一化);裁决前为 false */
  readonly installed: boolean;
  /** 哨兵测量值 |ts − performance.now()|(ms);裁决前为 NaN */
  readonly driftMs: number;
  /** 还原全局 rAF 引用(测试/热更新用);in-flight 已排队回调仍经包装放行 */
  restore(): void;
}

/** 守卫所需的最小 window 结构(DI 入参,测试用假窗口即可满足) */
export interface ClockWindow {
  requestAnimationFrame: (cb: (ts: number) => void) => number;
  performance: { now(): number };
}

/** 全局幂等标记:Symbol.for 注册表键,抗 HMR 模块重载(同键恒等) */
const GUARD_FLAG = Symbol.for("tu-design.raf-clock-guard");

type FlaggedClockWindow = ClockWindow & Record<PropertyKey, unknown>;

const NOOP_HANDLE: RafClockGuardHandle = Object.freeze({
  installed: false,
  driftMs: Number.NaN,
  restore: () => {},
});

/**
 * 安装 rAF 时钟守卫(幂等;同步包装、异步哨兵裁决)。
 *
 * 接线点:TuDesignProvider / ToastProvider setup 顶层(mode="none" 跳过)。
 * 任意环境可安全调用——干净时间线首帧即自恢复,零残留。
 *
 * @param win 宿主窗口(DI 入参;缺省全局 window,SSR 环境返回 no-op)
 * @returns 哨兵裁决后的句柄(幂等重入时返回已存在句柄的裁决)
 */
export function ensureRafClockGuard(win?: ClockWindow): Promise<RafClockGuardHandle> {
  const target: ClockWindow | undefined =
    win ?? (typeof window !== "undefined" ? window : undefined);
  // SSR / 非浏览器环境:无时钟可守
  if (!target) return Promise.resolve(NOOP_HANDLE);

  const w = target as FlaggedClockWindow;
  const existing = w[GUARD_FLAG] as RafClockGuardHandle | undefined;
  if (existing) return Promise.resolve(existing);

  // 原引用必须先于 bind 捕获:restore() 要求还原到 === 相等的原始值
  const rawRef = w.requestAnimationFrame;
  const rawRaf = rawRef.bind(w);
  const perf = w.performance;

  let state: "probing" | "armed" | "clean" = "probing";
  let driftMs = Number.NaN;
  let resolveDecision!: (handle: RafClockGuardHandle) => void;

  const wrapper = (cb: (ts: number) => void): number => {
    return rawRaf((ts) => {
      if (state === "probing") {
        driftMs = Math.round(Math.abs(ts - perf.now()));
        state = driftMs >= RAF_DRIFT_THRESHOLD_MS ? "armed" : "clean";
        if (state === "clean") {
          // 干净时间线:恢复全局原引用(本包装仅剩 in-flight 排队回调,放行语义不变)
          w.requestAnimationFrame = rawRef;
        } else if (import.meta.env.DEV) {
          console.info(
            `[tu-design] 检测到 rAF 时间线漂移 ${driftMs}ms(沙箱 rAF/performance ` +
              "时钟混用),已安装时钟归一化守卫,回调时间戳改传本地 performance.now()。" +
              "机制详注 overlay-shared/rafClock.ts(issue #6)。",
          );
        }
        resolveDecision(handle);
      }
      // 裁决前原样放行(= 原生行为);武装后改传本地时钟;干净后原样
      cb(state === "armed" ? perf.now() : ts);
    });
  };

  const handle: RafClockGuardHandle = {
    get installed() {
      return state === "armed";
    },
    get driftMs() {
      return driftMs;
    },
    restore() {
      w.requestAnimationFrame = rawRef;
    },
  };

  // 同步注册幂等标记(先于任何 await,双调用零窗口)
  w[GUARD_FLAG] = handle;
  // 同步包装全局引用:此后所有 rAF 消费方(zag Timer 等)经守卫解析
  w.requestAnimationFrame = wrapper;
  // 主动排一帧哨兵:裁决在首个真实消费计时器之前完成(~16ms)
  wrapper(() => {});

  return new Promise<RafClockGuardHandle>((resolve) => {
    resolveDecision = resolve;
  });
}
