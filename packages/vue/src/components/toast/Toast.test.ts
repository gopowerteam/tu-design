import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ToastProvider, useToast } from "./index";
import { __configureToaster, __getInternalToaster, __setToastMounted } from "./useToast";

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
});
