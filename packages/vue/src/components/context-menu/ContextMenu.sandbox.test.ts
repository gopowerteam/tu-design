import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ContextMenu } from "./index";
import type { MenuItemOption } from "../dropdown-menu/types";
import { TU_PROVIDER_KEY } from "../overlay-shared/config";

// vi.mock 文件级 hoisting：plan §4「接线盲区补位」——context-menu 曾是 9 个
// withSandboxStrategy 调用点中唯一无沙箱测试者；DropdownMenu 同构故不重复覆盖
vi.mock("../overlay-shared/sandbox", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../overlay-shared/sandbox")>();
  return {
    ...actual,
    isInIframeRealm: vi.fn(),
    isInWujie: vi.fn(),
  };
});

import { isInIframeRealm } from "../overlay-shared/sandbox";

const mockIframe = vi.mocked(isInIframeRealm);

const positioner = () =>
  document.querySelector<HTMLElement>('[data-scope="menu"][data-part="positioner"]');

const baseItems: MenuItemOption[] = [
  { type: "label", label: "操作" },
  { type: "item", value: "edit", label: "编辑" },
];

function mountMenu(provide?: Record<symbol, unknown>) {
  const Host = defineComponent({
    setup() {
      return () => h(ContextMenu, { items: baseItems }, { default: () => h("button", "右键我") });
    },
  });
  return mount(Host, { attachTo: document.body, global: { provide: provide ?? {} } });
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="menu"]').forEach((n) => n.remove());
  mockIframe.mockReset();
});

describe("ContextMenu 沙箱拓扑：定位策略（接线盲区补位）", () => {
  async function openWith(provide?: Record<symbol, unknown>) {
    const w = mountMenu(provide);
    await w.find('[data-part="context-trigger"]').trigger("contextmenu");
    await vi.waitFor(() => expect(positioner()).not.toBeNull());
    return w;
  }

  it("auto（无 Provider）：iframe realm 下 strategy 默认 fixed", async () => {
    mockIframe.mockReturnValue(true);
    const w = await openWith();
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("Provider mode=none：显式声明短路探测，保持 absolute", async () => {
    mockIframe.mockReturnValue(true); // 探测若参与会得到 fixed，显式值必须无视它
    const w = await openWith({ [TU_PROVIDER_KEY]: { mode: "none" } });
    expect(positioner()!.style.position).toBe("absolute");
    expect(mockIframe).not.toHaveBeenCalled();
    w.unmount();
  });
});
