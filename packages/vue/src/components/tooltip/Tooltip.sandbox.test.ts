import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Tooltip } from "./index";

// vi.mock 文件级 hoisting：本文件专测沙箱拓扑（无 Teleport，仅 strategy 修正）
vi.mock("../overlay-shared/sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../overlay-shared/sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

import { isInIframeRealm, isInWujie } from "../overlay-shared/sandbox";

const mockIframe = vi.mocked(isInIframeRealm);
const mockWujie = vi.mocked(isInWujie);

const positioner = () =>
  document.querySelector<HTMLElement>('[data-scope="tooltip"][data-part="positioner"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="tooltip"]').forEach((n) => n.remove());
  mockIframe.mockReset();
  mockWujie.mockReset();
});

function mountTooltip(props: Record<string, unknown> = {}) {
  const w = mount(Tooltip, {
    props: { content: "提示", defaultOpen: true, ...props },
    attachTo: document.body,
    slots: { default: '<button type="button">目标</button>' },
  });
  return w;
}

describe("Tooltip 沙箱拓扑", () => {
  it("iframe realm 且未显式指定 strategy 时 positioner 默认 fixed", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mountTooltip();
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("iframe realm 下用户显式 positioning.strategy 以其为准", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mountTooltip({ positioning: { strategy: "absolute" } });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  it("正常拓扑（非 iframe realm）保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);
    const w = mountTooltip();
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });
});
