import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { isInIframeRealm, isInWujie } from "./sandbox";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sandbox 探测", () => {
  it("isInIframeRealm：jsdom 正常拓扑（self === top）返回 false", () => {
    // jsdom 中 window.self === window.top === window，即无沙箱 / qiankun /
    // micro-app light DOM 等同文档拓扑的等价模拟 —— 组件在该场景不注入 fixed
    expect(isInIframeRealm()).toBe(false);
  });

  it("isInWujie：未注入标记时返回 false", () => {
    expect(isInWujie()).toBe(false);
  });

  it("isInWujie：官方标记为 true 时返回 true", () => {
    vi.stubGlobal("__POWERED_BY_WUJIE__", true);
    expect(isInWujie()).toBe(true);
  });

  it("isInWujie：标记为非布尔真值不算命中（严格 === true）", () => {
    vi.stubGlobal("__POWERED_BY_WUJIE__", "yes");
    expect(isInWujie()).toBe(false);
  });
});
