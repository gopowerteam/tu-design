import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TU_PROVIDER_KEY, type TuProviderConfig } from "../overlay-shared/config";
import { AlertDialog } from "./index";

// issue #5 T04：overlay 滚动锁契约接线验收（语义 B 拓扑闸 + RAII 配对）。
// props open + setProps 驱动（受控桥；AlertDialog 无 defaultOpen prop），勿用 vm ref。
// 复用 dialog machine：DOM data-scope="dialog"。

function mountAlertDialog(
  props: { open?: boolean } = {},
  attrs: { modal?: boolean | string } = {},
) {
  const releaseSpy = vi.fn();
  const lock = vi.fn(() => releaseSpy);
  const config: TuProviderConfig = { mode: "shadow-iframe", overlay: { lock } };
  const w = mount(AlertDialog, {
    props: { title: "标题", ...props },
    attrs,
    global: { provide: { [TU_PROVIDER_KEY]: config } },
    attachTo: document.body,
  });
  return { w, lock, releaseSpy };
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
  document.body.removeAttribute("data-scroll-lock");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("--scrollbar-width");
});

describe("AlertDialog overlay 滚动锁契约接线（issue #5）", () => {
  it("open→lock / close→release / 重开→再 lock / 打开态卸载补调", async () => {
    const { w, lock, releaseSpy } = mountAlertDialog({ open: false });
    expect(lock).not.toHaveBeenCalled();

    await w.setProps({ open: true });
    expect(lock).toHaveBeenCalledTimes(1);
    expect(releaseSpy).not.toHaveBeenCalled();

    await w.setProps({ open: false });
    expect(releaseSpy).toHaveBeenCalledTimes(1);

    await w.setProps({ open: true });
    expect(lock).toHaveBeenCalledTimes(2);

    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(2);
  });

  it("open=true 挂载即 lock（immediate），卸载补调", () => {
    const { w, lock, releaseSpy } = mountAlertDialog({ open: true });
    expect(lock).toHaveBeenCalledTimes(1);
    w.unmount();
    expect(releaseSpy).toHaveBeenCalledTimes(1);
  });

  it.each([false, "false"])("attrs :modal=%s → 不 lock（布尔与字符串双形态）", async (modal) => {
    const { w, lock, releaseSpy } = mountAlertDialog({ open: true }, { modal });
    expect(lock).not.toHaveBeenCalled();
    await w.setProps({ open: false });
    await w.setProps({ open: true });
    expect(lock).not.toHaveBeenCalled();
    expect(releaseSpy).not.toHaveBeenCalled();
    w.unmount();
  });

  it("无 overlay / none / shadow 拓扑：零 lock 零 release", async () => {
    const lock = vi.fn(() => vi.fn());
    const configs: TuProviderConfig[] = [
      { mode: "shadow-iframe" },
      { mode: "none", overlay: { lock } },
      { mode: "shadow", overlay: { lock } },
    ];
    for (const config of configs) {
      const w = mount(AlertDialog, {
        props: { title: "标题", open: true },
        global: { provide: { [TU_PROVIDER_KEY]: config } },
        attachTo: document.body,
      });
      await w.setProps({ open: false });
      await w.setProps({ open: true });
      expect(lock).not.toHaveBeenCalled();
      w.unmount();
    }
  });
});
