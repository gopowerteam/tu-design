<script setup lang="ts">
import type { PropType } from "vue";
import { provide } from "vue";
import { preventScrollOverride, TU_PROVIDER_KEY } from "../overlay-shared/config";
import type { TuOverlayContract, TuProviderMode } from "../overlay-shared/config";
import { ensureRafClockGuard } from "../overlay-shared/rafClock";
import { ToastProvider } from "../toast";
import type { TuToastConfig } from "./types";

/**
 * 应用根组件（可选层）：微前端环境显式声明 + 根部能力聚合。
 *
 * 1. `mode`：声明渲染环境，覆盖浮层组件的自动沙箱探测（Teleport 降级 /
 *    定位策略 / 模态滚动锁）。解析优先级：组件显式 prop > 本 mode > 自动探测。
 *    行为组语义与框架映射表见文档「微前端与沙箱 · 手动声明运行环境」。
 *    不挂载本组件或不传 mode 时，一切行为与自动探测现行版本完全一致。
 * 2. `:toast`：消息提示宿主（组合渲染 ToastProvider，present = enabled）；
 *    与独立挂载 ToastProvider 二选一，双挂载 dev 告警。
 * 3. `:overlay`：滚动锁契约（present = enabled，语义 B：仅锁禁用拓扑生效）；
 *    经 provide 快照透传，消费判定见 overlayContract()。非锁禁用拓扑下 dev 告警。
 * 4. rAF 时钟守卫（无 prop，哨兵自动）：沙箱时钟混用家族修复（issue #6，
 *    机制详注 overlay-shared/rafClock.ts）；mode="none" 显式关闭，其余 mode
 *    哨兵命中才安装（幂等，干净环境首帧自恢复零残留）。
 *
 * 四者均为 mount-time 契约（provide 快照 / ToastProvider 挂载时消费），
 * 动态变更用 :key 重挂载。须包住子应用根（inject 沿逻辑树，Teleport 子树同样命中；
 * 组件挂载在 Provider 子树之外时回落 auto 兜底）。
 */
defineOptions({ inheritAttrs: false });

const props = defineProps({
  /** 渲染环境声明（行为组名，非框架名）；缺省 auto = 现行探测链 */
  mode: { type: String as PropType<TuProviderMode>, default: "auto" },
  /** 消息提示宿主配置：未传不渲染 Toaster；传 {} 全走缺省 */
  toast: { type: Object as PropType<TuToastConfig>, default: undefined },
  /** overlay 滚动锁契约（present = enabled）：仅锁禁用拓扑消费（语义 B），mount-time */
  overlay: { type: Object as PropType<TuOverlayContract>, default: undefined },
});

// mount-time 快照：mode / overlay 变更不响应（契约见组件头注）
provide(TU_PROVIDER_KEY, { mode: props.mode, overlay: props.overlay });

// rAF 时钟守卫（setup 顶层同步安装，零空窗——toast/clipboard 等 zag rAF 计时
// 全部发生在用户交互，恒晚于根挂载）：mode="none" 显式关闭，其余哨兵门控
if (props.mode !== "none") void ensureRafClockGuard();

// dev 告警（每次 mount 一次，setup 顶层求值；auto 探测时机已探针实证）：
// 语义 B——overlay 契约仅锁禁用拓扑生效，其余拓扑传入即静默不消费，须显式提示
if (import.meta.env.DEV && props.overlay && preventScrollOverride(props.mode) !== false) {
  console.warn(
    "[tu-design] TuDesignProvider :overlay 仅锁禁用拓扑生效（语义 B）：当前 mode 下滚动锁未被禁用，overlay 契约不会被消费。",
  );
}
</script>

<template>
  <!-- present = enabled：:toast 传入即挂载消息宿主（组合复用 ToastProvider，零复制） -->
  <ToastProvider v-if="props.toast" v-bind="props.toast" />
  <slot />
</template>
