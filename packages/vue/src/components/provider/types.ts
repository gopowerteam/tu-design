import type { ToastPlacement } from "../toast/useToast";

/**
 * `TuDesignProvider` 的 `:toast` 命名空间配置（present = enabled）。
 * 各键语义与独立使用 ToastProvider 时的同名 prop 完全一致；mount-time 消费。
 */
export interface TuToastConfig {
  /** 弹出位置 */
  placement?: ToastPlacement;
  /** 默认自动关闭时长（ms） */
  duration?: number;
  /** 同屏最大数量，超出排队 */
  max?: number;
}

/**
 * 根部能力契约备忘（新能力加入 Provider 时遵循）：
 * - 命名空间对象 prop（如 toast），present = enabled，未传 = 该能力关闭；
 * - mount-time / reactive 必须显式声明，缺省 mount-time；
 * - 不再新增平级 Provider 组件，能力一律聚合到 TuDesignProvider。
 */
