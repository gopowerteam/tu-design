import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Dialog } from "./index";

// vi.mock 文件级 hoisting：本文件专测沙箱拓扑下模态滚动锁（issue #4），
// Dialog.test.ts（正常拓扑回归）保持零改动
vi.mock("../overlay-shared/sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../overlay-shared/sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

import { isInWujie } from "../overlay-shared/sandbox";

const mockWujie = vi.mocked(isInWujie);

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]');

function mountDialog(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(Dialog, { open: true, title: "标题", ...props }, { default: () => h("p", "内容区") });
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** remove-scroll 加锁的确定性信号（applyLock 无条件写 body 属性 + overflow:hidden）。
 * 注：jsdom 下 innerWidth − clientWidth ≡ 0，padding 补偿分支不可自然触发，
 * 「无 padding」为恒真断言不作判据；130px 实测见 issue #4 报告方 Playwright 验证 */
const locked = () => document.body.hasAttribute("data-scroll-lock");

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
  document.body.removeAttribute("data-scroll-lock");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("--scrollbar-width");
  mockWujie.mockReset();
});

describe("Dialog 沙箱拓扑：模态滚动锁（issue #4）", () => {
  it("wujie graft：打开弹窗不加滚动锁，body/html inline style 零写入", async () => {
    mockWujie.mockReturnValue(true);
    const bodyStyleBefore = document.body.getAttribute("style");
    const htmlStyleBefore = document.documentElement.getAttribute("style");

    const w = mountDialog();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    expect(locked()).toBe(false);
    expect(document.body.getAttribute("style")).toBe(bodyStyleBefore);
    expect(document.documentElement.getAttribute("style")).toBe(htmlStyleBefore);
    w.unmount();
  });

  it("非 wujie（独立运行）：滚动锁行为不变——body 加锁 + overflow:hidden", async () => {
    mockWujie.mockReturnValue(false);

    const w = mountDialog();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    expect(locked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    // 关闭后解锁还原
    w.unmount();
    await vi.waitFor(() => expect(locked()).toBe(false));
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("非 wujie + attrs 透传 :modal=false：不得因 prevent-scroll 硬编码而强加滚动锁", async () => {
    mockWujie.mockReturnValue(false);

    const w = mountDialog({ modal: false });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    // 守住 overlayPreventScroll 返回 undefined（交还 preventScroll=modal 派生默认）的语义
    expect(locked()).toBe(false);
    w.unmount();
  });
});
