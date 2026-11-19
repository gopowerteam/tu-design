import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { AlertDialog } from "./index";

// vi.mock 文件级 hoisting：模态滚动锁沙箱断言（issue #4），与 Dialog.sandbox.test.ts 同款；
// AlertDialog 复用 dialog machine，data-scope 为 dialog
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

function mountAlertDialog(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          AlertDialog,
          { open: true, title: "删除确认", ...props },
          { default: () => h("p", "此操作不可撤销") },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 断言信号说明见 Dialog.sandbox.test.ts 同款注释（jsdom 无 padding 分支可测性） */
const locked = () => document.body.hasAttribute("data-scroll-lock");

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
  document.body.removeAttribute("data-scroll-lock");
  document.body.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("--scrollbar-width");
  mockWujie.mockReset();
});

describe("AlertDialog 沙箱拓扑：模态滚动锁（issue #4）", () => {
  it("wujie graft：打开确认框不加滚动锁，body/html inline style 零写入", async () => {
    mockWujie.mockReturnValue(true);
    const bodyStyleBefore = document.body.getAttribute("style");
    const htmlStyleBefore = document.documentElement.getAttribute("style");

    const w = mountAlertDialog();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    expect(locked()).toBe(false);
    expect(document.body.getAttribute("style")).toBe(bodyStyleBefore);
    expect(document.documentElement.getAttribute("style")).toBe(htmlStyleBefore);
    w.unmount();
  });

  it("非 wujie（独立运行）：滚动锁行为不变——body 加锁 + overflow:hidden", async () => {
    mockWujie.mockReturnValue(false);

    const w = mountAlertDialog();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    expect(locked()).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    w.unmount();
    await vi.waitFor(() => expect(locked()).toBe(false));
  });
});
