import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider, useToast } from "./index";
import {
  __configureToaster,
  __getInternalToaster,
  __getToastHostCount,
  __setToastMounted,
} from "./useToast";

afterEach(() => {
  __setToastMounted(false);
  __getInternalToaster().remove();
});

describe("useToast", () => {
  it("返回稳定的单例引用", () => {
    expect(useToast()).toBe(useToast());
  });

  it("success/error/info/warning/loading 各创建对应 type 的 toast", () => {
    __setToastMounted(true);
    __configureToaster({ max: 24 });
    const toast = useToast();
    const duration = 60_000;

    toast.success({ title: "ok", duration });
    toast.error({ title: "bad", duration });
    toast.info({ title: "hint", duration });
    toast.warning({ title: "care", duration });
    toast.loading({ title: "wait", duration });

    const types = __getInternalToaster()
      .getVisibleToasts()
      .map((t) => t.type)
      .sort((a, b) => String(a).localeCompare(String(b)));
    expect(types).toEqual(["error", "info", "loading", "success", "warning"]);
  });

  it("dismiss 关闭指定 toast，不传 id 清空全部（需 Provider 挂载以驱动状态机）", async () => {
    const w = mount(ToastProvider);
    __setToastMounted(true);
    const toast = useToast();
    const store = __getInternalToaster();
    const duration = 60_000;

    const a = toast.success({ title: "a", duration });
    const b = toast.success({ title: "b", duration });
    expect(b).toBeTypeOf("string");
    expect(store.getCount()).toBe(2);
    // 等 Toaster 的 group 状态机完成首帧同步再触发 dismiss
    await vi.waitFor(() => expect(w.text()).toContain("a"), { timeout: 5000 });

    toast.dismiss(a);
    await vi.waitFor(
      () => {
        expect(w.text()).not.toContain("a");
        expect(w.text()).toContain("b");
      },
      { timeout: 5000 },
    );

    toast.dismiss();
    await vi.waitFor(() => expect(w.text()).not.toContain("b"), { timeout: 5000 });

    w.unmount();
  });

  it("promise 跟踪 Promise 状态并返回 unwrap", async () => {
    __setToastMounted(true);
    const toast = useToast();
    const result = toast.promise(
      Promise.resolve(42),
      { loading: { title: "提交中" }, success: { title: "已提交" }, error: { title: "失败" } },
      { duration: 60_000 },
    );
    expect(result?.unwrap).toBeTypeOf("function");
    await expect(result!.unwrap()).resolves.toBe(42);
  });
});

describe("ToastProvider", () => {
  it("未挂载 Provider 时调用 toast 方法输出 dev 警告", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    __setToastMounted(false);

    useToast().info({ title: "too early" });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("ToastProvider");
    warn.mockRestore();
  });

  it("props 重建内部 store，useToast 引用保持稳定", async () => {
    const before = useToast();
    const w = mount(ToastProvider, {
      props: { placement: "top-start", duration: 5000, max: 5 },
    });

    const store = __getInternalToaster();
    expect(store.attrs.placement).toBe("top-start");
    expect(store.attrs.duration).toBe(5000);
    expect(store.attrs.max).toBe(5);
    expect(useToast()).toBe(before);
    expect(useToast()).toBe(useToast());

    w.unmount();
  });

  it("渲染 toast 并提供可关闭按钮（aria-label=关闭）", async () => {
    __setToastMounted(true);
    const w = mount(ToastProvider);
    useToast().success({ title: "已保存", description: "更改已生效", duration: 60_000 });
    await vi.waitFor(() => {
      expect(w.text()).toContain("已保存");
      expect(w.text()).toContain("更改已生效");
    });
    const close = w.find('[aria-label="关闭"]');
    expect(close.exists()).toBe(true);
    w.unmount();
  });

  it("#icon 作用域插槽覆盖内置语义图标（注入 type）", async () => {
    __setToastMounted(true);
    const w = mount(ToastProvider, {
      slots: {
        icon: ({ type }: { type: unknown }) =>
          h("span", { "data-testid": `icon-${String(type)}` }, "icon"),
      },
    });
    useToast().success({ title: "已保存", duration: 60_000 });
    await vi.waitFor(() => {
      expect(w.find('[data-testid="icon-success"]').exists()).toBe(true);
      // 内置语义 svg 被覆盖：仅剩关闭钮的 CloseIcon 一个 svg
      expect(w.findAll("svg").length).toBe(1);
    });
    w.unmount();
  });
});

// Provider 重挂载（HMR / v-if 路由切换 / 多应用）不得换掉 store：
// 换 store 会丢队列，且先前 create() 返回的 id 在 dismiss/update 时全部指向不存在的 toast。
describe("ToastProvider store 生命周期", () => {
  it("同配置重挂载复用 store：先前 toast 与 id 仍有效", async () => {
    const w1 = mount(ToastProvider);
    const store = __getInternalToaster();
    const id = useToast().success({ title: "留存", duration: 60_000 });
    expect(store.getCount()).toBe(1);

    w1.unmount();
    const w2 = mount(ToastProvider);

    expect(__getInternalToaster()).toBe(store);
    expect(__getInternalToaster().getCount()).toBe(1);
    useToast().dismiss(id);
    w2.unmount();
  });

  it("配置变更才重建 store", async () => {
    const w1 = mount(ToastProvider);
    const first = __getInternalToaster();
    w1.unmount();

    const w2 = mount(ToastProvider, { props: { max: 9 } });
    expect(__getInternalToaster()).not.toBe(first);
    expect(__getInternalToaster().attrs.max).toBe(9);
    w2.unmount();
  });

  // —— 双宿主引用计数（TuDesignProvider :toast 与 ToastProvider 并存防护）——
  it("双宿主并存告警一次；先卸载其一，另一宿主 toast 仍正常且不误报未挂载", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w1 = mount(ToastProvider);
    const w2 = mount(ToastProvider, { props: { max: 5 } });
    expect(__getToastHostCount()).toBe(2);
    expect(warn.mock.calls.filter((a) => String(a[0]).includes("[tu-design]"))).toHaveLength(1);
    expect(String(warn.mock.calls.flat())).toContain("重复挂载");

    w1.unmount();
    // 只裁决 [tu-design] 语义告警（zag dismissable 的 "branch node" 属卸载时序内部噪音，与本契约无关）
    const tuDesignWarns = () => warn.mock.calls.filter((a) => String(a[0]).includes("[tu-design]"));
    warn.mockClear();
    useToast().success({ title: "仍工作", duration: 60_000 });
    await vi.waitFor(() => expect(w2.text()).toContain("仍工作"));
    expect(tuDesignWarns()).toHaveLength(0);

    w2.unmount();
    expect(__getToastHostCount()).toBe(0);
    warn.mockRestore();
  });
});

// 连接样式守卫（issue #7）：jsdom 测不了布局位移，源码级断言是唯一自动化防线。
// 防两类回归：① 格式化/重构误删 <style> 消费块（多条 toast 重叠遮挡复发）；
// ② 回潮叠加 tw-animate keyframes（双动画引擎位移冲突）。
describe("Toast 连接样式（Zag CSS 变量消费）", () => {
  const src = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "ToastProvider.vue"),
    "utf8",
  );

  it.each([
    "translate: var(--x) var(--y)",
    "scale: var(--scale)",
    "z-index: var(--z-index)",
    "height: var(--height)",
    "opacity: var(--opacity)",
    '[data-state="closed"]',
  ])("包含消费片段 %s", (fragment) => {
    expect(src).toContain(fragment);
  });

  it("rootBase 不残留 tw-animate 入退场类", () => {
    expect(src).not.toMatch(/animate-(in|out)/);
    expect(src).not.toMatch(/slide-(in|out)-from|slide-out-to/);
  });
});
