import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TuDesignProvider } from "./index";
import { useTuProvider } from "../overlay-shared/config";
import { Dialog } from "../dialog";

// 显式 mode 短路证明的对照组：mock 探测原语给出与声明相反的答案
vi.mock("../overlay-shared/sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../overlay-shared/sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

// rAF 时钟守卫接线证明:no-op 代位(mode="none" 零调用 / 其余安装,机制单测见 rafClock.test.ts)
vi.mock("../overlay-shared/rafClock", () => ({
  ensureRafClockGuard: vi.fn(() =>
    Promise.resolve({ installed: false, driftMs: Number.NaN, restore: () => {} }),
  ),
}));

import { isInWujie } from "../overlay-shared/sandbox";
import { ensureRafClockGuard } from "../overlay-shared/rafClock";
import { __getToastHostCount, __setToastMounted } from "../toast/useToast";

const mockWujie = vi.mocked(isInWujie);
const mockEnsureGuard = vi.mocked(ensureRafClockGuard);

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]');
const locked = () => document.body.hasAttribute("data-scroll-lock");

function mountWithProvider(
  providerProps: Record<string, unknown>,
  Child = defineComponent({
    setup() {
      return () => h(Dialog, { open: true, title: "标题" }, { default: () => h("p", "内容") });
    },
  }),
) {
  const Host = defineComponent({
    setup: () => () => h(TuDesignProvider, providerProps, { default: () => h(Child) }),
  });
  return mount(Host, { attachTo: document.body });
}

afterEach(() => {
  document.body
    .querySelectorAll('[data-scope="dialog"], [data-scope="toast"]')
    .forEach((n) => n.remove());
  document.body.removeAttribute("data-scroll-lock");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("--scrollbar-width");
  mockWujie.mockReset();
  mockEnsureGuard.mockClear();
  // ToastProvider 若经 :toast 挂载，其 onBeforeUnmount 已配对递减；此处复位测试失败
  // 中断导致的残留计数（while 兜底，正常路径 0 次循环）
  while (__getToastHostCount() > 0) __setToastMounted(false);
});

describe("TuDesignProvider mode 显式环境声明", () => {
  it("shadow-iframe：环境无 wujie 标记也禁用滚动锁（显式覆盖，探测不参与）", async () => {
    mockWujie.mockReturnValue(false);
    const w = mountWithProvider({ mode: "shadow-iframe" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(locked()).toBe(false);
    expect(mockWujie).not.toHaveBeenCalled();
    w.unmount();
  });

  it("none：marker 为 true 也保留滚动锁（显式覆盖反方向）", async () => {
    mockWujie.mockReturnValue(true);
    const w = mountWithProvider({ mode: "none" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(locked()).toBe(true);
    expect(mockWujie).not.toHaveBeenCalled();
    w.unmount();
    expect(locked()).toBe(false);
  });

  it("对照：不挂 Provider 维持 auto 探测现状（marker false → 锁启用）", async () => {
    mockWujie.mockReturnValue(false);
    const w = mountWithProvider({});
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(locked()).toBe(true);
    w.unmount();
  });

  it("嵌套 Provider：内层声明优先", () => {
    let mode: string | undefined;
    const Reader = defineComponent({
      setup() {
        mode = useTuProvider().mode;
        return () => h("div");
      },
    });
    const Host = defineComponent({
      setup: () => () =>
        h(
          TuDesignProvider,
          { mode: "none" },
          { default: () => h(TuDesignProvider, { mode: "shadow" }, { default: () => h(Reader) }) },
        ),
    });
    const w = mount(Host);
    expect(mode).toBe("shadow");
    w.unmount();
  });
});

describe("TuDesignProvider rAF 时钟守卫接线", () => {
  it("显式隔离 mode:setup 顶层安装一次", () => {
    mockEnsureGuard.mockClear();
    const w = mountWithProvider({ mode: "shadow-iframe" });
    expect(mockEnsureGuard).toHaveBeenCalledTimes(1);
    w.unmount();
  });

  it("auto + :toast:Provider 与组合的 ToastProvider 各安装一次", () => {
    mockEnsureGuard.mockClear();
    const w = mountWithProvider({ mode: "auto", toast: {} });
    expect(mockEnsureGuard).toHaveBeenCalledTimes(2);
    w.unmount();
  });

  it("none + :toast:组合链全程跳过(mode 经 inject 继承,显式关全部适配)", () => {
    mockEnsureGuard.mockClear();
    const w = mountWithProvider({ mode: "none", toast: {} });
    expect(mockEnsureGuard).not.toHaveBeenCalled();
    w.unmount();
  });
});

describe("TuDesignProvider :toast 聚合", () => {
  it("present = enabled：传 {} 渲染消息宿主并可出提示；未传不渲染", async () => {
    const Host = defineComponent({
      setup: () => () =>
        h(TuDesignProvider, { toast: { duration: 60_000 } }, { default: () => h("div") }),
    });
    const w = mount(Host, { attachTo: document.body });
    expect(document.querySelector('[data-scope="toast"]')).not.toBeNull();

    const { useToast } = await import("../toast/useToast");
    useToast().success({ title: "经 Provider 出提示", duration: 60_000 });
    await vi.waitFor(() => expect(document.body.textContent).toContain("经 Provider 出提示"));
    w.unmount();

    const Host2 = defineComponent({
      setup: () => () => h(TuDesignProvider, {}, { default: () => h("div") }),
    });
    const w2 = mount(Host2, { attachTo: document.body });
    expect(document.querySelector('[data-scope="toast"]')).toBeNull();
    w2.unmount();
  });
});
