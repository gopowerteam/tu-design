import { mount } from "@vue/test-utils";
import { defineComponent, ref } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import { TU_PROVIDER_KEY, type TuProviderConfig } from "./config";
import { useOverlayScrollLock } from "./useOverlayScrollLock";

// composable 级测试纪律（探针实证）：defineComponent wrapper 内部 ref 驱动；
// @vue/test-utils vm 对 expose ref 自动解包，经 vm.open = x 赋值，勿 .value。
// vue-tsc 不推断动态 expose() 类型：vm 访问收敛到 setOpen 闭包内单点 cast。
// sync flush 契约：开合转换内 lock/release 同步完成，断言无需 nextTick。

function makeHost(initialOpen: boolean, modal: () => boolean) {
  return defineComponent({
    setup(_, { expose }) {
      const open = ref(initialOpen);
      useOverlayScrollLock(open, modal);
      expose({ open });
      return () => null;
    },
  });
}

/** vm 对 expose ref 自动解包赋值（单点 cast 收敛 vue-tsc 动态 expose 类型盲区） */
function openSetter(w: { vm: unknown }): (v: boolean) => void {
  return (v) => {
    (w.vm as { open: boolean }).open = v;
  };
}

function mountLock(
  opts: { initialOpen?: boolean; modal?: () => boolean; config?: TuProviderConfig | null } = {},
) {
  const releaseSpy = vi.fn();
  const lock = vi.fn(() => releaseSpy);
  const config: TuProviderConfig | null =
    opts.config === undefined ? { mode: "shadow-iframe", overlay: { lock } } : opts.config;
  const w = mount(makeHost(opts.initialOpen ?? false, opts.modal ?? (() => true)), {
    global: { provide: config ? { [TU_PROVIDER_KEY]: config } : {} },
  });
  return { w, lock, releaseSpy, setOpen: openSetter(w) };
}

describe("useOverlayScrollLock", () => {
  it("RAII 配对：open→lock / close→release / 重开→再 lock / 卸载补调（sync 同步断言）", () => {
    const { w, lock, releaseSpy, setOpen } = mountLock();
    expect(lock).not.toHaveBeenCalled();

    setOpen(true);
    expect(lock).toHaveBeenCalledTimes(1);
    expect(releaseSpy).not.toHaveBeenCalled();

    setOpen(false);
    expect(releaseSpy).toHaveBeenCalledTimes(1);

    setOpen(true);
    expect(lock).toHaveBeenCalledTimes(2);
    expect(releaseSpy).toHaveBeenCalledTimes(1);

    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(2);
  });

  it("快速翻转不合并：同 tick true-false-true → lock 2 次 release 1 次", () => {
    const { w, lock, releaseSpy, setOpen } = mountLock();
    setOpen(true);
    setOpen(false);
    setOpen(true);
    expect(lock).toHaveBeenCalledTimes(2);
    expect(releaseSpy).toHaveBeenCalledTimes(1);
    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(2);
  });

  it("immediate：初始 open=true 挂载即 lock，卸载补调 release", () => {
    const { w, lock, releaseSpy } = mountLock({ initialOpen: true });
    expect(lock).toHaveBeenCalledTimes(1);
    expect(releaseSpy).not.toHaveBeenCalled();
    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(1);
  });

  it("非模态守卫：open 时 isModal()=false 不 lock；isModal 仅在转换回调内求值（冻结语义）", () => {
    let modal = false;
    const { w, lock, releaseSpy, setOpen } = mountLock({ modal: () => modal, initialOpen: true });
    expect(lock).not.toHaveBeenCalled();

    // isOpen 未变 → 无转换回调 → 不 lock（不 watch attrs/modal）
    modal = true;
    expect(lock).not.toHaveBeenCalled();

    setOpen(false);
    setOpen(true);
    expect(lock).toHaveBeenCalledTimes(1);

    // 打开期间变非模态：isOpen 未变 → 不提前 release（冻结语义）
    modal = false;
    expect(releaseSpy).not.toHaveBeenCalled();

    setOpen(false);
    expect(releaseSpy).toHaveBeenCalledTimes(1);
    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(1);
  });

  it.each(["none", "shadow"] as const)(
    "拓扑闸 %s：overlay present 仍零 lock 零 release",
    (mode) => {
      const releaseSpy = vi.fn();
      const lock = vi.fn(() => releaseSpy);
      const { w, setOpen } = mountLock({ config: { mode, overlay: { lock } }, initialOpen: true });
      expect(lock).not.toHaveBeenCalled();
      setOpen(false);
      setOpen(true);
      expect(lock).not.toHaveBeenCalled();
      expect(releaseSpy).not.toHaveBeenCalled();
      w.unmount();
      expect(releaseSpy).not.toHaveBeenCalled();
    },
  );

  it("拓扑闸：shadow-iframe 无 overlay / 不注入 Provider → 零 lock 零 release", () => {
    for (const config of [{ mode: "shadow-iframe" } as TuProviderConfig, null]) {
      const { w, lock, releaseSpy, setOpen } = mountLock({ config, initialOpen: true });
      expect(lock).not.toHaveBeenCalled();
      setOpen(false);
      setOpen(true);
      expect(lock).not.toHaveBeenCalled();
      expect(releaseSpy).not.toHaveBeenCalled();
      w.unmount();
      expect(releaseSpy).not.toHaveBeenCalled();
    }
  });

  it("嵌套多实例独立配对：各自持有 release，关闭/卸载只补调自己的", () => {
    const releases = [vi.fn(), vi.fn()];
    let next = 0;
    const lock = vi.fn(() => releases[next++]!);
    const config: TuProviderConfig = { mode: "shadow-iframe", overlay: { lock } };
    const make = () => {
      const w = mount(
        makeHost(false, () => true),
        {
          global: { provide: { [TU_PROVIDER_KEY]: config } },
        },
      );
      return { w, setOpen: openSetter(w) };
    };
    const a = make();
    const b = make();

    a.setOpen(true);
    b.setOpen(true);
    expect(lock).toHaveBeenCalledTimes(2);

    a.setOpen(false);
    expect(releases[0]).toHaveBeenCalledTimes(1);
    expect(releases[1]).not.toHaveBeenCalled();

    b.w.unmount();
    expect(releases[1]).toHaveBeenCalledTimes(1);

    a.w.unmount();
    expect(releases[0]).toHaveBeenCalledTimes(1); // 关闭时已 release，卸载不重复补调
  });
});
