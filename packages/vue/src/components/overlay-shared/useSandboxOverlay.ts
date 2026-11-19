import type { ComputedRef } from "vue";
import { computed, getCurrentInstance, onMounted, ref } from "vue";
import {
  type TuProviderConfig,
  preventScrollOverride,
  strategyFixed,
  teleportDegrade,
  useTuProvider,
} from "./config";

/**
 * 浮层沙箱适配公共层（Popover 0.5.3 修复的推广形态，机制与实测依据见 sandbox.ts 头注）：
 * - useSandboxTeleportTarget：Teleport 目标降级（真 shadow DOM / wujie graft → 应用挂载容器）
 * - withSandboxStrategy：iframe realm 下 positioning.strategy 默认 fixed（absolute 包含块错位修正）
 * - overlayPreventScroll：模态浮层滚动锁按沙箱拓扑降级（wujie graft 下禁用，issue #4）
 *
 * 三项均「Provider mode 显式声明优先、缺省 auto 走探测」，解析语义见 config.ts。
 */

/**
 * 浮层 Teleport 目标解析：显式 to > Provider mode / 探测降级 > body。
 *
 * app._container 在 mount 的 render 完成后才赋值（runtime-core 3.5.43：render L4337
 * → 赋值 L4340），而子组件 onMounted 在 render 内同步执行、届时仍为 undefined，
 * 故检测再延后一个微任务（mount 调用栈结束后 _container 必已赋值），结果存 ref
 * 驱动 computed 重算；getCurrentInstance 仅 setup 同步上下文可用，本函数须在
 * setup 顶层调用。共享 Vue（__MICRO_SHARED__）下各子应用 app._container 相互
 * 独立，检测按实例隔离。
 * 降级判定：显式 mode（shadow / shadow-iframe）短路降级、none 恒不降；auto 走现行
 * 双信号——真 shadow DOM 由 getRootNode() 命中，wujie graft 下 getRootNode/父链被
 * patch 伪装（实测）故叠加 marker。结构 shadowRoot 信号仅 auto 分支参与（显式声明
 * 时不再猜测）。其余微前端（qiankun / micro-app light DOM）body 即主文档 body，兜底正确。
 *
 * @param explicitTo 组件显式 to 的取值函数（响应式安全：computed 内重读）
 * @returns Teleport 目标（显式 to 优先，其次降级容器，兜底 body）
 */
export function useSandboxTeleportTarget(
  explicitTo: () => string | HTMLElement | undefined,
): ComputedRef<string | HTMLElement> {
  const instance = getCurrentInstance();
  const { mode } = useTuProvider();
  const degrade = teleportDegrade(mode);
  const detectedTarget = ref<string | HTMLElement>("body");
  onMounted(() => {
    queueMicrotask(() => {
      if (explicitTo()) return;
      const container = (instance?.appContext.app as { _container?: HTMLElement } | undefined)
        ?._container;
      if (
        container &&
        (degrade || (mode === "auto" && container.getRootNode() instanceof ShadowRoot))
      ) {
        detectedTarget.value = container;
      }
    });
  });
  return computed(() => explicitTo() ?? detectedTarget.value);
}

/**
 * 用户未显式指定 strategy 时按环境注入缺省 fixed：shadow-iframe 显式注入、
 * none / shadow 恒不注入、auto 走 isInIframeRealm 探测（非 graft 拓扑下 fixed 与
 * absolute 坐标等价，零副作用；graft 下 absolute 包含块错位，fixed 是唯一正确解）。
 * 优先级：user.strategy > Provider mode/探测 > 不注入。
 * 纯函数、原地写入 merged（调用方传入自己的合成对象，无共享引用风险）；
 * user.strategy 显式给出（含 null 意义上的「未传」判定用 == null）时以其为准。
 * config 须在组件 setup 顶层经 useTuProvider() 捕获后传入（computed 内 inject 不可用）。
 *
 * @param user 用户原始 positioning（undefined 或经 attrs 透传的合成对象）
 * @param merged 组件已合成 placement/sameWidth 等的基础 positioning（将被写入）
 * @param config 应用级沙箱配置快照（setup 顶层 useTuProvider() 结果）
 * @returns 写入 strategy 后的 merged（同引用，便于 computed 直接 return）
 */
export function withSandboxStrategy<T extends object>(
  user: T | undefined,
  merged: T,
  config: TuProviderConfig,
): T {
  if ((user as { strategy?: string } | undefined)?.strategy == null && strategyFixed(config.mode)) {
    (merged as { strategy?: string }).strategy = "fixed";
  }
  return merged;
}

/**
 * 模态浮层滚动锁策略（dialog / alert-dialog / drawer 共用，issue #4）：
 * 按 useTuProvider().mode 解析（shadow-iframe 禁用 / none、shadow 交还缺省 /
 * auto 走 isInWujie 探测）。禁用依据：@zag-js/remove-scroll 的补偿公式
 * `scrollbarWidth = win.innerWidth − documentElement.clientWidth` 在 graft 下跨坐标系
 * （iframe 报宿主视口宽，documentElement 是 graft 进 shadowRoot 的子应用容器），
 * 宿主 chrome 宽被误当滚动条写入渲染 body（padding-right）→ 弹窗开合整页重排抖动；
 * 且主流 wujie 拓扑下子应用 body 本就不滚（滚动在宿主容器），锁无收益只有副作用。
 * 拓扑边界：若子应用 body 自身可滚，禁用后背景随弹窗可滚——带误补偿的锁不如不要，
 * wujie 下真正的「锁背景」需宿主参与（见 plan §6 follow-up）。
 * 传硬编码 true 永远禁止——本库组件单根、attrs 透传，消费方 :modal="false" 的
 * 既有用法会被强加滚动锁（行为回归），undefined 经适配层 cleanProps 过滤后
 * 保留 zag 缺省 preventScroll = modal。
 * 须在 setup 顶层调用（inject 约束）。
 *
 * @returns false=禁用滚动锁；undefined=不覆盖 Ark 缺省
 */
export function overlayPreventScroll(): boolean | undefined {
  return preventScrollOverride(useTuProvider().mode);
}
