import type { InjectionKey } from "vue";
import { inject } from "vue";
import { isInIframeRealm, isInWujie } from "./sandbox";

/**
 * TuDesignProvider 应用级显式配置层（plan: tu-design-provider-mode）。
 *
 * 动机：自动探测（marker / realm / 结构信号）存在固有边界——marker 随 wujie 版本漂移、
 * degrade 模式无法区分、故障静默。本模块新增手动声明层，解析优先级：
 *   组件显式 prop（to / positioning.strategy 等，已有） > Provider mode（本模块） > 自动探测（auto 缺省）。
 *
 * mode 语义 = 「隔离构成」行为组，判据是拓扑而非框架品牌（机制详注见 sandbox.ts 头注）：
 * - none          = { }                                // 独立运行 / qiankun / micro-app lightDOM / 纯 iframe 嵌入 / wujie degrade
 * - shadow        = { teleport降级 }                   // micro-app strictStyleIsolation / web component
 * - shadow-iframe = { teleport降级, fixed策略, 锁禁用 } // wujie 默认模式（iframe realm + shadow graft 双重隔离）
 * - auto（缺省）  = 现行探测链，行为与历史版本逐字节一致
 *
 * 纪律：
 * - 显式 mode 一律短路，不进入任何探测代码（marker 漂移免疫的可证性质）；
 * - mode 只表达渲染环境单维度；新的根部能力走 Provider 命名空间对象 prop（present = enabled），
 *   且每个 prop 必须注明 mount-time / reactive（缺省 mount-time）；
 * - `none` 是「显式关全部适配」，不保证与 auto 逐位等值（如纯 iframe 下 auto 会注入无害 fixed）。
 */

/** 渲染环境声明（行为组名，非框架名） */
export type TuProviderMode = "auto" | "none" | "shadow" | "shadow-iframe";

/** Provider 注入的配置快照（mount-time 消费；动态变更用 :key 重挂载） */
export interface TuProviderConfig {
  mode: TuProviderMode;
  /**
   * overlay 命名空间 prop（present = enabled，mount-time；issue #5）。
   * 可选键：既有 provide({ mode }) 字面量与 DEFAULT_CONFIG 不受影响。
   */
  overlay?: TuOverlayContract;
}

/** provide/inject 契约键（沿逻辑树传递，Teleport 子树同样命中） */
export const TU_PROVIDER_KEY: InjectionKey<TuProviderConfig> = Symbol("tu-provider");

const DEFAULT_CONFIG: TuProviderConfig = { mode: "auto" };

/**
 * 读取应用级配置；无 Provider 时缺省 auto（= 未引入本特性前的行为，向后兼容兜底）。
 * 须在 setup 顶层调用（inject 约束）。
 * @returns 最近 Provider 的配置快照，或 { mode: "auto" }
 */
export function useTuProvider(): TuProviderConfig {
  return inject(TU_PROVIDER_KEY, DEFAULT_CONFIG);
}

/**
 * Teleport 目标降级判定：shadow / shadow-iframe → 降级到应用挂载容器；
 * none → 恒 body；auto → 现行 isInWujie 探测（结构 shadowRoot 信号在
 * useSandboxTeleportTarget 内与本结果 OR，仅 auto 分支参与）。
 * @param mode 环境声明
 * @returns 是否强制降级（显式 mode 下不执行任何探测）
 */
export function teleportDegrade(mode: TuProviderMode): boolean {
  switch (mode) {
    case "none":
      return false;
    case "shadow":
    case "shadow-iframe":
      return true;
    case "auto":
      return isInWujie();
  }
}

/**
 * positioning.strategy 缺省 fixed 判定：仅 shadow-iframe（iframe realm + graft 坐标错位）
 * 与 auto 的 isInIframeRealm 探测注入；用户显式 strategy 的优先级在调用方
 * （withSandboxStrategy）先行短路。
 * @param mode 环境声明
 * @returns 用户未指定 strategy 时是否注入 fixed
 */
export function strategyFixed(mode: TuProviderMode): boolean {
  switch (mode) {
    case "none":
    case "shadow":
      return false;
    case "shadow-iframe":
      return true;
    case "auto":
      return isInIframeRealm();
  }
}

/**
 * 模态滚动锁策略：shadow-iframe → false（禁用，issue #4 的 graft 坐标系误补偿）；
 * none / shadow → undefined（交还 Ark preventScroll=modal 派生默认）；
 * auto → 现行 isInWujie ? false : undefined。
 * 传硬编码 true 永远禁止——attrs 透传 :modal=false 的既有用法会被强加滚动锁（行为回归）。
 * @param mode 环境声明
 * @returns false=显式禁用；undefined=不覆盖 Ark 缺省
 */
export function preventScrollOverride(mode: TuProviderMode): boolean | undefined {
  switch (mode) {
    case "none":
    case "shadow":
      return undefined;
    case "shadow-iframe":
      return false;
    case "auto":
      return isInWujie() ? false : undefined;
  }
}

/**
 * overlay 滚动锁契约（issue #5）：消费方提供 lock() → 解锁函数，
 * 契约层只负责「是否消费」的拓扑判定，不包装、不持有状态。
 */
export interface TuOverlayContract {
  lock(): VoidFunction;
}

/**
 * overlay 契约消费判定（语义 B：仅锁禁用拓扑消费，issue #5）。
 * overlay 命名空间 prop present = enabled，mount-time 消费；
 * 仅当 preventScrollOverride(mode) === false（shadow-iframe 显式 / auto 探测命中 wujie）
 * 时透传契约引用，其余拓扑（none / shadow / auto 非 wujie / 未提供 overlay）一律 null。
 * 显式 mode 短路探测的性质由 preventScrollOverride 继承（marker 漂移免疫）。
 * @param config Provider 配置快照
 * @returns 锁禁用拓扑下为 config.overlay 同引用，否则 null
 */
export function overlayContract(config: TuProviderConfig): TuOverlayContract | null {
  return config.overlay && preventScrollOverride(config.mode) === false ? config.overlay : null;
}
