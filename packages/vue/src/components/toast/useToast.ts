import { createToaster } from "@ark-ui/vue/toast";
import type {
  ToastOptions as ArkToastOptions,
  ToastPlacement as ArkToastPlacement,
  ToastPromiseOptions as ArkToastPromiseOptions,
} from "@ark-ui/vue/toast";

export type ToastOptions = ArkToastOptions;
export type ToastPlacement = ArkToastPlacement;
export type ToastPromiseOptions<T> = ArkToastPromiseOptions<T>;

/** Provider 缺省配置（与 Provider props 默认值保持一致） */
const DEFAULTS = {
  placement: "bottom-end" as ArkToastPlacement,
  duration: 3000,
  max: 3,
};

// 模块级单例：useToast() 在任何地方返回同一个外观对象（引用稳定），
// 内部转发到 current 指向的 zag store；Provider 挂载时按 props 重建 store。
let current = createToaster(DEFAULTS);
let currentConfig = { ...DEFAULTS };
// 宿主引用计数：ToastProvider 实例（含 TuDesignProvider :toast 组合出的）各计一个。
// 布尔标志会让「双宿主先卸载其一」误关 mounted 态（后挂载者赢、先卸载者误报），
// 计数归零才算真未挂载；归零同时复位双宿主告警标志（新一轮可再告警）。
let hostCount = 0;
let doubleHostWarned = false;

/**
 * 按 props 重建单例内部 store（ToastProvider 挂载时调用）。
 * 配置未变化时复用现有 store，避免 Provider 重挂载丢弃排队中的 toast。
 * 返回 store 供 Provider 的 <Toaster> 渲染使用。
 * @param props - Provider 传入的 placement/duration/max 配置，缺省项回退内置默认值
 * @returns 当前 toast store 实例
 */
export function __configureToaster(
  props: Partial<{ placement: ArkToastPlacement; duration: number; max: number }> = {},
) {
  const next = { ...DEFAULTS, ...props };
  if (
    next.placement === currentConfig.placement &&
    next.duration === currentConfig.duration &&
    next.max === currentConfig.max
  ) {
    return current;
  }
  currentConfig = next;
  current = createToaster(next);
  return current;
}

/**
 * 读取当前内部 store（测试用）。
 * @returns 当前模块单例指向的 toast store 实例
 */
export function __getInternalToaster() {
  return current;
}

/**
 * 宿主挂载/卸载计数的测试出口：true 计 +1，false 计 −1（下限 0）。
 * 计数 >1（双宿主并存，TuDesignProvider :toast 与 ToastProvider 同挂）时 dev 告警一次。
 * @param value - true 表示一个宿主挂载，false 表示一个宿主卸载
 */
export function __setToastMounted(value: boolean) {
  hostCount += value ? 1 : -1;
  if (hostCount <= 0) {
    hostCount = 0;
    doubleHostWarned = false;
  } else if (hostCount > 1 && import.meta.env.DEV && !doubleHostWarned) {
    doubleHostWarned = true;
    console.warn(
      "[tu-design] toast 宿主重复挂载：<TuDesignProvider :toast> 与 <ToastProvider> 二选一，同时挂载时后挂载者的配置生效，请先卸载其一。",
    );
  }
}

/**
 * 读取当前宿主计数（测试用）。
 * @returns 已挂载 toast 宿主数量
 */
export function __getToastHostCount(): number {
  return hostCount;
}

/**
 * Provider 未挂载时在开发环境输出告警，提醒先在应用根部挂载 <ToastProvider>。
 */
function warnIfUnmounted() {
  if (hostCount === 0 && import.meta.env.DEV) {
    console.warn(
      "[tu-design] 在 <ToastProvider> 挂载前调用了 toast。请在应用根部挂载一次 <ToastProvider>，否则提示不会渲染。",
    );
  }
}

// 外观对象在模块级创建一次，保证 useToast() 引用恒定
const toastApi = {
  /**
   * 成功提示。
   * @param options - toast 配置（标题、描述、时长等）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  success: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "success" });
  },
  /**
   * 错误提示。
   * @param options - toast 配置（标题、描述、时长等）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  error: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "error" });
  },
  /**
   * 信息提示。
   * @param options - toast 配置（标题、描述、时长等）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  info: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "info" });
  },
  /**
   * 警告提示。
   * @param options - toast 配置（标题、描述、时长等）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  warning: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "warning" });
  },
  /**
   * 加载中提示。
   * @param options - toast 配置（标题、描述、时长等）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  loading: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "loading" });
  },
  /**
   * 跟踪 Promise 状态的提示。
   * @param promise - 待跟踪的 Promise 或返回 Promise 的工厂函数
   * @param options - Promise 各阶段（loading/success/error）的 toast 配置
   * @param shared - 各阶段共享的基础配置（不含 type）
   * @returns 该条 toast 的创建结果，可用于后续控制
   */
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ArkToastPromiseOptions<T>,
    shared?: Omit<ToastOptions, "type">,
  ) => {
    warnIfUnmounted();
    return current.promise(promise, options, shared);
  },
  /**
   * 关闭指定 toast；不传 id 时关闭全部。
   * @param id - 目标 toast 的 id；缺省时关闭全部
   */
  dismiss: (id?: string) => {
    warnIfUnmounted();
    current.dismiss(id);
  },
};

/**
 * 获取 toast API。模块级单例外观对象，任意位置调用返回同一引用（引用稳定）；
 * 内部转发到 Provider 挂载后重建的 store，调用前须在应用根部挂载 <ToastProvider>。
 * @returns toast 操作 API（success/error/info/warning/loading/promise/dismiss）
 */
export function useToast() {
  return toastApi;
}

export type ToastApi = typeof toastApi;
