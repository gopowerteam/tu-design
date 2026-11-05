import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DropdownMenu } from "./index";
import { ContextMenu } from "../context-menu";
import type { MenuItemOption } from "./types";

// vi.mock 文件级 hoisting：本文件专测沙箱拓扑（无 Teleport，仅 strategy 修正；
// DropdownMenu 点击定位 / ContextMenu 指针 anchorPoint 定位同 machine）
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
  document.querySelector<HTMLElement>('[data-scope="menu"][data-part="positioner"]');

const ITEMS: MenuItemOption[] = [{ type: "item", value: "a", label: "动作 A" }];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="menu"]').forEach((n) => n.remove());
  mockIframe.mockReset();
  mockWujie.mockReset();
});

describe("DropdownMenu 沙箱拓扑", () => {
  it("iframe realm 且未显式指定 strategy 时 positioner 默认 fixed", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mount(DropdownMenu, {
      props: { items: ITEMS, defaultOpen: true },
      slots: { default: () => [h("button", { type: "button" }, "菜单")] },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("iframe realm 下用户显式 positioning.strategy 以其为准", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mount(DropdownMenu, {
      props: { items: ITEMS, defaultOpen: true, positioning: { strategy: "absolute" } },
      slots: { default: () => [h("button", { type: "button" }, "菜单")] },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  it("正常拓扑（非 iframe realm）保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);
    const w = mount(DropdownMenu, {
      props: { items: ITEMS, defaultOpen: true },
      slots: { default: () => [h("button", { type: "button" }, "菜单")] },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });
});

function mountContextMenu(props: { items?: MenuItemOption[] } = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          ContextMenu,
          { items: ITEMS, ...props },
          { default: () => h("button", { type: "button" }, "右键区") },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

// ArkMenu.Root 不渲染 DOM（wrapper 树为空），触发元素在 body 下，
// 事件走原生 dispatch（与 ContextMenu.test.ts 的 document.querySelector 同理）
function fireContextMenu() {
  const el = document.querySelector<HTMLElement>('[data-part="context-trigger"]')!;
  el.dispatchEvent(new Event("contextmenu"));
}

describe("ContextMenu 沙箱拓扑", () => {
  it("iframe realm 下右键唤出的 positioner 默认 fixed（指针 anchorPoint 视口坐标对齐）", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mountContextMenu({ items: ITEMS });
    fireContextMenu();
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("正常拓扑（非 iframe realm）保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);
    const w = mountContextMenu({ items: ITEMS });
    fireContextMenu();
    await vi.waitFor(() => expect(positioner()).toBeTruthy());
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });
});
