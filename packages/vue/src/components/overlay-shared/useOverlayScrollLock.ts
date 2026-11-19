import type { Ref } from "vue";
import { onBeforeUnmount, watch } from "vue";
import { overlayContract, useTuProvider } from "./config";

/**
 * overlay 滚动锁契约消费（issue #5）：wujie graft 下 Ark 原生滚动锁被禁用（issue #4），
 * 「锁背景」改由宿主经 Provider overlay 命名空间 prop 提供 lock() → 解锁函数契约。
 *
 * 设计依据（冻结语义）：
 * - 语义 B 拓扑闸：仅锁禁用拓扑消费契约（overlayContract 内判定，shadow-iframe 显式 /
 *   auto 探测命中 wujie），其余拓扑 setup 顶层直接 return，零 watch 零副作用。
 * - RAII 配对：lock() 返回的 release 与开合状态一一对应——open 且模态时持锁，
 *   关闭/非模态时释放，onBeforeUnmount 补调防泄漏（打开态直接卸载不丢 release）。
 * - sync + immediate：flush:"sync" 使 lock/release 在 isOpen 转换内同步完成，
 *   无 nextTick 窗口、同 tick 快速翻转不合并（true-false-true → lock 2 次 release 1 次）；
 *   immediate 覆盖初始 open=true 的挂载即锁场景。
 * - isModal 仅在 isOpen 转换回调内求值，不 watch attrs：打开期间 modal 变化不触发
 *   锁状态变更（三组件接线 () => attrs.modal !== false && attrs.modal !== "false"）。
 *
 * @param isOpen - 开合状态（受控桥 ComputedRef 或内部 ref 均可）
 * @param isModal - 模态判定读取器（仅转换回调内求值）
 */
export function useOverlayScrollLock(isOpen: Ref<boolean>, isModal: () => boolean): void {
  const contract = overlayContract(useTuProvider());
  if (!contract) return;

  let release: VoidFunction | null = null;

  watch(
    isOpen,
    (open) => {
      if (open && isModal() && !release) {
        release = contract.lock();
      } else if ((!open || !isModal()) && release) {
        release();
        release = null;
      }
    },
    { immediate: true, flush: "sync" },
  );

  onBeforeUnmount(() => {
    if (release) {
      release();
      release = null;
    }
  });
}
