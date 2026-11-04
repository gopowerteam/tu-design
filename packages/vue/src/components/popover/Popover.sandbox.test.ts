import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Popover } from "./index";

// vi.mock 文件级 hoisting：本文件专测沙箱拓扑，模块级替换探测函数，
// 不影响 Popover.test.ts（正常拓扑回归的证明文件保持零改动）
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

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');
const positioner = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="positioner"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
  mockIframe.mockReset();
  mockWujie.mockReset();
});

function mountPopover(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(Popover, props, {
          default: () => [h("button", { type: "button" }, "点我")],
          content: () => "气泡内容",
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Popover 沙箱拓扑", () => {
  // —— wujie graft：getRootNode 被伪装，靠 marker 降级 teleport 目标 ——
  it("wujie 标记下 teleport 目标自动降级为应用挂载容器", async () => {
    mockWujie.mockReturnValue(true);
    mockIframe.mockReturnValue(true);

    const appContainer = document.createElement("div");
    appContainer.id = "wujie-app-container";
    document.body.appendChild(appContainer);

    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Popover,
            { defaultOpen: true },
            {
              default: () => [h("button", { type: "button" }, "点我")],
              content: () => "气泡内容",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: appContainer });

    // detectedTarget 在 onMounted 微任务中落定 → Teleport 重挂载到容器内
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    await vi.waitFor(() => expect(appContainer.contains(content()!)).toBe(true));
    // teleport 目标确为 app._container（attachTo 产生的挂载壳，等价真实场景的 #app），
    // 而非兜底 body
    const mountShell = appContainer.firstElementChild as HTMLElement;
    expect(positioner()!.parentElement).toBe(mountShell);
    w.unmount();
    appContainer.remove();
  });

  // —— iframe realm：非 graft 拓扑 fixed 与 absolute 等价；graft（wujie）下 fixed 是
  //    唯一包含块正确的策略 —— 默认注入 fixed ——
  it("iframe realm 且未显式指定 strategy 时默认 fixed", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);

    const w = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    // zag 把 positioning.strategy 落在 positioner 内联 position 上（端态断言）
    expect(positioner()!.style.position).toBe("fixed");
    w.unmount();
  });

  it("iframe realm 下用户显式传 positioning.strategy 时以其为准", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(true);

    const w = mountPopover({
      defaultOpen: true,
      positioning: { strategy: "absolute" },
    });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  it("正常拓扑（非 iframe realm）不注入 strategy，保持默认 absolute", async () => {
    mockWujie.mockReturnValue(false);
    mockIframe.mockReturnValue(false);

    const w = mountPopover({ defaultOpen: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(positioner()!.style.position).toBe("absolute");
    w.unmount();
  });

  // —— wujie 降级（degrade）模式预期：teleport 落容器而非 body（非致命，
  //    降级 iframe 自身有视口裁剪）——
  it("wujie 下显式 to 仍以用户指定目标为准", async () => {
    mockWujie.mockReturnValue(true);
    mockIframe.mockReturnValue(true);

    const target = document.createElement("div");
    target.id = "explicit-target";
    document.body.appendChild(target);

    const w = mountPopover({ defaultOpen: true, to: "#explicit-target" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(target.contains(content()!)).toBe(true);
    w.unmount();
    target.remove();
  });
});
