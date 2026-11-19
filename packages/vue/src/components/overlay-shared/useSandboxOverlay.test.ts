import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { withSandboxStrategy } from "./useSandboxOverlay";

// vi.mock 文件级 hoisting：模块级替换探测函数（useSandboxTeleportTarget 内部引用
// 同一模块实例，mock 生效）；withSandboxStrategy 同源，纯函数用例随拓扑切换
vi.mock("./sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

import { isInIframeRealm, isInWujie } from "./sandbox";
import { TU_PROVIDER_KEY } from "./config";
import { overlayPreventScroll, useSandboxTeleportTarget } from "./useSandboxOverlay";

const mockIframe = vi.mocked(isInIframeRealm);
const mockWujie = vi.mocked(isInWujie);

afterEach(() => {
  mockIframe.mockReset();
  mockWujie.mockReset();
});

describe("withSandboxStrategy", () => {
  type Pos = { strategy?: string; placement?: string };
  const AUTO = { mode: "auto" as const };
  it("iframe realm 且用户未显式指定 strategy 时注入 fixed（原地写入 merged 并返回同引用）", () => {
    mockIframe.mockReturnValue(true);
    const merged: Pos = { placement: "bottom-start" };
    const out = withSandboxStrategy(undefined, merged, AUTO);
    expect(out).toBe(merged);
    expect(out.strategy).toBe("fixed");
  });

  it("iframe realm 下用户显式 strategy 以其为准", () => {
    mockIframe.mockReturnValue(true);
    const out = withSandboxStrategy<Pos>({ strategy: "absolute" }, { strategy: "absolute" }, AUTO);
    expect(out.strategy).toBe("absolute");
  });

  it("正常拓扑（非 iframe realm）不注入 strategy", () => {
    mockIframe.mockReturnValue(false);
    const out = withSandboxStrategy<Pos>(undefined, {}, AUTO);
    expect(out.strategy).toBeUndefined();
  });

  it("user 为 undefined 但非 iframe realm：merged 原样返回", () => {
    mockIframe.mockReturnValue(false);
    const merged: Pos = { placement: "top" };
    expect(withSandboxStrategy(undefined, merged, AUTO)).toEqual({ placement: "top" });
  });

  it("显式 mode=shadow-iframe 时无视探测注入 fixed；mode=none 时无视探测不注入", () => {
    mockIframe.mockReturnValue(false); // 探测若参与会给出相反答案
    expect(withSandboxStrategy<Pos>(undefined, {}, { mode: "shadow-iframe" }).strategy).toBe(
      "fixed",
    );
    mockIframe.mockReturnValue(true);
    expect(withSandboxStrategy<Pos>(undefined, {}, { mode: "none" }).strategy).toBeUndefined();
    expect(mockIframe).not.toHaveBeenCalled();
  });
});

describe("useSandboxTeleportTarget", () => {
  it("显式 to 恒优先（含 wujie 下）", () => {
    mockWujie.mockReturnValue(true);
    const Host = defineComponent({
      setup() {
        const target = useSandboxTeleportTarget(() => "#explicit");
        return () => h("div", String(target.value));
      },
    });
    const w = mount(Host);
    expect(w.text()).toBe("#explicit");
    w.unmount();
  });

  it("非沙箱（shadow/wujie 均未命中）兜底 body", async () => {
    mockWujie.mockReturnValue(false);
    const Host = defineComponent({
      setup() {
        const target = useSandboxTeleportTarget(() => undefined);
        return () => h("div", String(target.value));
      },
    });
    const w = mount(Host);
    await vi.waitFor(() => expect(w.text()).toBe("body"));
    w.unmount();
  });
});

describe("overlayPreventScroll", () => {
  // inject 约束：setup 顶层调用，经挂载宿主取返回值
  function readPreventScroll(): boolean | undefined {
    let out: boolean | undefined;
    const Host = defineComponent({
      setup() {
        out = overlayPreventScroll();
        return () => h("div");
      },
    });
    const w = mount(Host);
    w.unmount();
    return out!;
  }

  it("auto（无 Provider）：wujie 探测 true → false（禁用滚动锁，issue #4）", () => {
    mockWujie.mockReturnValue(true);
    expect(readPreventScroll()).toBe(false);
  });

  it("auto（无 Provider）：非 wujie → undefined（交还 Ark preventScroll=modal 缺省，不得硬编码 true）", () => {
    mockWujie.mockReturnValue(false);
    expect(readPreventScroll()).toBeUndefined();
  });

  it("Provider mode=none 显式覆盖探测：mock wujie=true 也交还缺省（锁保留）", () => {
    mockWujie.mockReturnValue(true);
    let out: boolean | undefined;
    const Host = defineComponent({
      setup() {
        out = overlayPreventScroll();
        return () => h("div");
      },
    });
    const w = mount(Host, { global: { provide: { [TU_PROVIDER_KEY]: { mode: "none" } } } });
    expect(out).toBeUndefined();
    expect(mockWujie).not.toHaveBeenCalled(); // 显式 mode 短路证明
    w.unmount();
  });
});
