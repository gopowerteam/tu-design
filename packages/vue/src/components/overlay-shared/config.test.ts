import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  TU_PROVIDER_KEY,
  preventScrollOverride,
  strategyFixed,
  teleportDegrade,
  useTuProvider,
} from "./config";

// 探测原语 mock：auto 分支必须调用、显式 mode 必须零调用（短路证明）
vi.mock("./sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

import { isInIframeRealm, isInWujie } from "./sandbox";

const mockIframe = vi.mocked(isInIframeRealm);
const mockWujie = vi.mocked(isInWujie);

afterEach(() => {
  mockIframe.mockReset();
  mockWujie.mockReset();
});

describe("useTuProvider", () => {
  it("无 Provider 时缺省 auto（现行为兜底）", () => {
    const Host = defineComponent({
      setup() {
        const cfg = useTuProvider();
        return () => h("div", cfg.mode);
      },
    });
    const w = mount(Host);
    expect(w.text()).toBe("auto");
    w.unmount();
  });

  it("provide 覆盖后按声明值返回", () => {
    const Host = defineComponent({
      setup() {
        const cfg = useTuProvider();
        return () => h("div", cfg.mode);
      },
    });
    const w = mount(Host, {
      global: { provide: { [TU_PROVIDER_KEY]: { mode: "shadow-iframe" } } },
    });
    expect(w.text()).toBe("shadow-iframe");
    w.unmount();
  });
});

describe("teleportDegrade（Teleport 降级行为组）", () => {
  it("none 不降级且不探测", () => {
    expect(teleportDegrade("none")).toBe(false);
    expect(mockWujie).not.toHaveBeenCalled();
  });

  it("shadow / shadow-iframe 降级且不探测（marker 漂移免疫）", () => {
    mockWujie.mockReturnValue(false); // 探测若被调用会给出错误答案，显式值必须无视它
    expect(teleportDegrade("shadow")).toBe(true);
    expect(teleportDegrade("shadow-iframe")).toBe(true);
    expect(mockWujie).not.toHaveBeenCalled();
  });

  it("auto 走 isInWujie 探测（现状不变）", () => {
    mockWujie.mockReturnValue(true);
    expect(teleportDegrade("auto")).toBe(true);
    expect(mockWujie).toHaveBeenCalledTimes(1);
  });
});

describe("strategyFixed（定位策略注入行为组）", () => {
  it("none / shadow 不注入且不探测", () => {
    mockIframe.mockReturnValue(true);
    expect(strategyFixed("none")).toBe(false);
    expect(strategyFixed("shadow")).toBe(false);
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("shadow-iframe 注入且不探测", () => {
    mockIframe.mockReturnValue(false);
    expect(strategyFixed("shadow-iframe")).toBe(true);
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("auto 走 isInIframeRealm 探测（现状不变）", () => {
    mockIframe.mockReturnValue(true);
    expect(strategyFixed("auto")).toBe(true);
    expect(mockIframe).toHaveBeenCalledTimes(1);
  });
});

describe("preventScrollOverride（滚动锁行为组）", () => {
  it("none / shadow 交还 Ark 缺省（undefined）且不探测", () => {
    mockWujie.mockReturnValue(true);
    expect(preventScrollOverride("none")).toBeUndefined();
    expect(preventScrollOverride("shadow")).toBeUndefined();
    expect(mockWujie).not.toHaveBeenCalled();
  });

  it("shadow-iframe 禁用（false）且不探测", () => {
    mockWujie.mockReturnValue(false);
    expect(preventScrollOverride("shadow-iframe")).toBe(false);
    expect(mockWujie).not.toHaveBeenCalled();
  });

  it("auto = 现行 isInWujie ? false : undefined（issue #4 行为不变）", () => {
    mockWujie.mockReturnValue(true);
    expect(preventScrollOverride("auto")).toBe(false);
    mockWujie.mockReturnValue(false);
    expect(preventScrollOverride("auto")).toBeUndefined();
  });
});
