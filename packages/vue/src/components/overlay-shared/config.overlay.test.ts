import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, afterEach } from "vite-plus/test";
import type { TuOverlayContract, TuProviderConfig } from "./config";
import { TU_PROVIDER_KEY, overlayContract, useTuProvider } from "./config";

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

/** 契约桩：lock() 返回解锁函数（消费方语义，契约层只透传引用） */
function makeContract(): TuOverlayContract {
  return { lock: () => () => {} };
}

describe("overlayContract（语义 B：仅锁禁用拓扑消费，issue #5）", () => {
  it("none + overlay → null（preventScrollOverride=undefined，非锁禁用拓扑）", () => {
    const overlay = makeContract();
    const config: TuProviderConfig = { mode: "none", overlay };
    expect(overlayContract(config)).toBeNull();
    expect(mockWujie).not.toHaveBeenCalled();
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("shadow + overlay → null（preventScrollOverride=undefined）", () => {
    const overlay = makeContract();
    expect(overlayContract({ mode: "shadow", overlay })).toBeNull();
    expect(mockWujie).not.toHaveBeenCalled();
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("shadow-iframe + overlay → 同引用（锁禁用拓扑，透传不包装）", () => {
    const overlay = makeContract();
    mockWujie.mockReturnValue(false); // 探测若被调用会给出错误答案，显式值必须无视它
    expect(overlayContract({ mode: "shadow-iframe", overlay })).toBe(overlay);
    expect(mockWujie).not.toHaveBeenCalled();
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("auto + overlay：isInWujie true → contract / false → null（现行探测链）", () => {
    const overlay = makeContract();
    mockWujie.mockReturnValue(true);
    expect(overlayContract({ mode: "auto", overlay })).toBe(overlay);
    expect(mockWujie).toHaveBeenCalledTimes(1);
    mockWujie.mockReturnValue(false);
    expect(overlayContract({ mode: "auto", overlay })).toBeNull();
    expect(mockWujie).toHaveBeenCalledTimes(2);
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("无 overlay 键 → null（present = enabled，缺省不启用）", () => {
    expect(overlayContract({ mode: "shadow-iframe" })).toBeNull();
    expect(overlayContract({ mode: "auto" })).toBeNull();
    expect(overlayContract({ mode: "none" })).toBeNull();
    expect(mockWujie).not.toHaveBeenCalled();
    expect(mockIframe).not.toHaveBeenCalled();
  });

  it("显式 mode 短路探测：none/shadow/shadow-iframe 全程 mockWujie 零调用", () => {
    const overlay = makeContract();
    mockWujie.mockReturnValue(true);
    overlayContract({ mode: "none", overlay });
    overlayContract({ mode: "shadow", overlay });
    overlayContract({ mode: "shadow-iframe", overlay });
    expect(mockWujie).not.toHaveBeenCalled();
    expect(mockIframe).not.toHaveBeenCalled();
  });
});

describe("兼容性（overlay 可选键不破坏既有契约）", () => {
  it("无 Provider 时 DEFAULT_CONFIG 缺省 auto 且无 overlay 键", () => {
    const Host = defineComponent({
      setup() {
        const cfg = useTuProvider();
        return () =>
          h("div", `${cfg.mode}:${cfg.overlay === undefined ? "no-overlay" : "overlay"}`);
      },
    });
    const w = mount(Host);
    expect(w.text()).toBe("auto:no-overlay");
    w.unmount();
  });

  it("既有 provide({ mode }) 字面量无需 overlay 键即可编译与消费", () => {
    const legacy: TuProviderConfig = { mode: "shadow-iframe" };
    const Host = defineComponent({
      setup() {
        const cfg = useTuProvider();
        return () => h("div", `${cfg.mode}:${overlayContract(cfg) === null ? "null" : "contract"}`);
      },
    });
    const w = mount(Host, {
      global: { provide: { [TU_PROVIDER_KEY]: legacy } },
    });
    expect(w.text()).toBe("shadow-iframe:null");
    w.unmount();
    expect(legacy.overlay).toBeUndefined();
    expect(mockWujie).not.toHaveBeenCalled();
  });
});
