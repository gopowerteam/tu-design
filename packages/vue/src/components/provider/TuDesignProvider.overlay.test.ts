import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { TuDesignProvider } from "./index";
import { useTuProvider } from "../overlay-shared/config";
import type { TuOverlayContract, TuProviderConfig } from "../overlay-shared/config";

// 与哨兵同构：mock 探测原语，auto 分支的 wujie 命中由测试控制
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
const makeContract = (): TuOverlayContract => ({ lock: () => () => {} });

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
  mockWujie.mockReset();
});

function mountProvider(props: Record<string, unknown>) {
  let injected: TuProviderConfig | undefined;
  const Reader = defineComponent({
    setup() {
      injected = useTuProvider();
      return () => h("div");
    },
  });
  const w = mount(TuDesignProvider, { props, slots: { default: () => h(Reader) } });
  return { w, read: () => injected as TuProviderConfig };
}

describe("TuDesignProvider :overlay dev 告警矩阵（语义 B：仅锁禁用拓扑生效）", () => {
  it.each([
    { mode: "none", wujie: false, warns: 1 },
    { mode: "shadow", wujie: false, warns: 1 },
    { mode: "shadow-iframe", wujie: false, warns: 0 },
    { mode: "auto", wujie: false, warns: 1 },
    { mode: "auto", wujie: true, warns: 0 },
  ])("mode=$mode wujie=$wujie + overlay → warn $warns 次", ({ mode, wujie, warns }) => {
    mockWujie.mockReturnValue(wujie);
    const { w } = mountProvider({ mode, overlay: makeContract() });
    expect(warnSpy).toHaveBeenCalledTimes(warns);
    if (warns > 0) {
      expect(String(warnSpy.mock.calls[0][0])).toContain("仅锁禁用拓扑生效");
    }
    w.unmount();
  });

  it("无 overlay prop → 不告警（present = enabled）", () => {
    mockWujie.mockReturnValue(false);
    const { w } = mountProvider({ mode: "none" });
    expect(warnSpy).not.toHaveBeenCalled();
    w.unmount();
  });

  it("warn 按 mount 一次：重挂载再次告警，不用模块级全局标志", () => {
    mockWujie.mockReturnValue(false);
    const first = mountProvider({ mode: "none", overlay: makeContract() });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    first.w.unmount();
    const second = mountProvider({ mode: "none", overlay: makeContract() });
    expect(warnSpy).toHaveBeenCalledTimes(2);
    second.w.unmount();
  });
});

describe("TuDesignProvider :overlay provide 快照（mount-time）", () => {
  it("inject 快照含 overlay 且为同引用", () => {
    mockWujie.mockReturnValue(false);
    const overlay = makeContract();
    const { w, read } = mountProvider({ mode: "shadow-iframe", overlay });
    expect(read().overlay).toBe(overlay);
    expect(read().mode).toBe("shadow-iframe");
    w.unmount();
  });

  it("mount 后 setProps 改 overlay 不改变 inject 值（mount-time 快照）", async () => {
    mockWujie.mockReturnValue(false);
    const original = makeContract();
    const { w, read } = mountProvider({ mode: "shadow-iframe", overlay: original });
    expect(read().overlay).toBe(original);
    await w.setProps({ overlay: makeContract() });
    await nextTick();
    expect(read().overlay).toBe(original);
    w.unmount();
  });
});
