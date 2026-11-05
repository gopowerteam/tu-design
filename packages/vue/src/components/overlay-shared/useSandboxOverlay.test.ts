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
import { useSandboxTeleportTarget } from "./useSandboxOverlay";

const mockIframe = vi.mocked(isInIframeRealm);
const mockWujie = vi.mocked(isInWujie);

afterEach(() => {
  mockIframe.mockReset();
  mockWujie.mockReset();
});

describe("withSandboxStrategy", () => {
  type Pos = { strategy?: string; placement?: string };
  it("iframe realm 且用户未显式指定 strategy 时注入 fixed（原地写入 merged 并返回同引用）", () => {
    mockIframe.mockReturnValue(true);
    const merged: Pos = { placement: "bottom-start" };
    const out = withSandboxStrategy(undefined, merged);
    expect(out).toBe(merged);
    expect(out.strategy).toBe("fixed");
  });

  it("iframe realm 下用户显式 strategy 以其为准", () => {
    mockIframe.mockReturnValue(true);
    const out = withSandboxStrategy<Pos>({ strategy: "absolute" }, { strategy: "absolute" });
    expect(out.strategy).toBe("absolute");
  });

  it("非 iframe realm 不注入 strategy", () => {
    mockIframe.mockReturnValue(false);
    const out = withSandboxStrategy<Pos>(undefined, {});
    expect(out.strategy).toBeUndefined();
  });

  it("user 为 undefined 但非 iframe realm：merged 原样返回", () => {
    mockIframe.mockReturnValue(false);
    const merged: Pos = { placement: "top" };
    expect(withSandboxStrategy(undefined, merged)).toEqual({ placement: "top" });
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
