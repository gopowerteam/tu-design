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
let providerMounted = false;

/**
 * 按 props 重建单例内部 store（ToastProvider 挂载时调用）。
 * 返回新 store 供 Provider 的 <Toaster> 渲染使用。
 */
export function __configureToaster(
  props: Partial<{ placement: ArkToastPlacement; duration: number; max: number }> = {},
) {
  current = createToaster({ ...DEFAULTS, ...props });
  return current;
}

/** 读取当前内部 store（测试用） */
export function __getInternalToaster() {
  return current;
}

/** 标记 Provider 已挂载/已卸载（Provider 生命周期与测试用） */
export function __setToastMounted(value: boolean) {
  providerMounted = value;
}

function warnIfUnmounted() {
  if (!providerMounted && import.meta.env.DEV) {
    console.warn(
      "[tu-design] 在 <ToastProvider> 挂载前调用了 toast。请在应用根部挂载一次 <ToastProvider>，否则提示不会渲染。",
    );
  }
}

// 外观对象在模块级创建一次，保证 useToast() 引用恒定
const toastApi = {
  /** 成功提示 */
  success: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "success" });
  },
  /** 错误提示 */
  error: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "error" });
  },
  /** 信息提示 */
  info: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "info" });
  },
  /** 警告提示 */
  warning: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "warning" });
  },
  /** 加载中提示 */
  loading: (options: ToastOptions) => {
    warnIfUnmounted();
    return current.create({ ...options, type: "loading" });
  },
  /** 跟踪 Promise 状态的提示 */
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: ArkToastPromiseOptions<T>,
    shared?: Omit<ToastOptions, "type">,
  ) => {
    warnIfUnmounted();
    return current.promise(promise, options, shared);
  },
  /** 关闭指定 toast；不传 id 时关闭全部 */
  dismiss: (id?: string) => {
    warnIfUnmounted();
    current.dismiss(id);
  },
};

export function useToast() {
  return toastApi;
}

export type ToastApi = typeof toastApi;
