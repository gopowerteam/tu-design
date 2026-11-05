import { mount } from "@vue/test-utils";
import { describe, expect, it, vi, afterEach } from "vite-plus/test";
import { DatePicker } from "./index";

// 经 PickerShell 链路验证沙箱适配（Shell 覆盖 Date/Month/Year/Week 四组件）
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
  document.querySelector<HTMLElement>('[data-scope="date-picker"][data-part="positioner"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="date-picker"]').forEach((n) => n.remove());
  mockIframe.mockReset();
  mockWujie.mockReset();
});

describe("DatePicker（PickerShell 链路）沙箱拓扑", () => {
  it("iframe realm 且未显式指定 strategy 时 positioner 默认 fixed", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", open: true },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("iframe realm 下用户显式 positioning.strategy 以其为准", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", open: true, positioning: { strategy: "absolute" } },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  it("wujie 标记下 teleport 目标自动降级为应用挂载容器", async () => {
    mockWujie.mockReturnValue(true);
    mockIframe.mockReturnValue(true);
    const appContainer = document.createElement("div");
    document.body.appendChild(appContainer);
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", open: true },
      attachTo: appContainer,
    });
    await vi.waitFor(() => expect(appContainer.contains(positioner()!)).toBe(true));
    const mountShell = appContainer.firstElementChild as HTMLElement;
    expect(positioner()!.parentElement).toBe(mountShell);
    w.unmount();
    appContainer.remove();
  });

  it("正常拓扑（非 iframe realm）保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", open: true },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });
});
