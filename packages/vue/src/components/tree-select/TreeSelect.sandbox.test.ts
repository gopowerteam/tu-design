import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { TreeSelect } from "./index";

// vi.mock 文件级 hoisting：本文件专测沙箱拓扑，模块级替换探测函数，
// 不影响 TreeSelect.test.ts（正常拓扑回归的证明文件保持零改动）
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
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="positioner"]');

const OPTIONS = [{ key: "a", label: "节点 A" }];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
  mockIframe.mockReset();
  mockWujie.mockReset();
});

function mountTree(props: Record<string, unknown> = {}, attachTo?: HTMLElement) {
  const Host = defineComponent({
    setup() {
      return () => h(TreeSelect, { options: OPTIONS, ...props });
    },
  });
  return mount(Host, { attachTo: attachTo ?? document.body });
}

async function open(w: ReturnType<typeof mountTree>) {
  await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
  await vi.waitFor(() => expect(positioner()).toBeTruthy());
}

describe("TreeSelect 沙箱拓扑", () => {
  it("iframe realm 且未显式指定 strategy 时 positioner 默认 fixed", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mountTree();
    await open(w);
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("iframe realm 下用户显式 positioning.strategy 以其为准", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);
    const w = mountTree({ positioning: { strategy: "absolute" } });
    await open(w);
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  it("wujie 标记下 teleport 目标自动降级为应用挂载容器", async () => {
    mockWujie.mockReturnValue(true);
    mockIframe.mockReturnValue(true);
    const appContainer = document.createElement("div");
    document.body.appendChild(appContainer);
    const w = mountTree({}, appContainer);
    await open(w);
    // teleport 目标确为挂载容器（attachTo 挂载壳等价真实场景的 #app），而非兜底 body
    const mountShell = appContainer.firstElementChild as HTMLElement;
    expect(positioner()!.parentElement).toBe(mountShell);
    w.unmount();
    appContainer.remove();
  });

  it("正常拓扑（非 iframe realm）保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);
    const w = mountTree();
    await open(w);
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });
});
