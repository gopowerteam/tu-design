import { flushPromises, mount } from "@vue/test-utils";
import { h } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import TableColumnSettings from "./TableColumnSettings.vue";

// Phase 2：单例宿主（Popover trigger="manual" + 固定 0x0 锚点 + portal）行为锁定。

const popoverContent = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

describe("TableColumnSettings 单例宿主", () => {
  it("open=true：渲染 default 插槽内容，锚点为 absolute 根相对坐标", async () => {
    const wrapper = mount(TableColumnSettings, {
      props: {
        open: false,
        anchorStyle: { position: "absolute", width: "0", height: "0", left: "12px", top: "34px" },
      },
      slots: { default: () => h("div", { id: "panel-content" }, "面板内容") },
      attachTo: document.body,
    });
    await flushPromises();
    // 未打开：面板内容在 DOM 但处于关闭态（Popover 非 lazy，默认隐藏）
    expect(popoverContent()?.hasAttribute("hidden")).toBe(true);

    await wrapper.setProps({ open: true });
    await vi.waitFor(() => expect(popoverContent()?.hasAttribute("hidden")).toBe(false));
    expect(popoverContent()!.textContent).toContain("面板内容");

    const anchor = wrapper.find("[data-column-settings-anchor]");
    expect(anchor.exists()).toBe(true);
    expect((anchor.element as HTMLElement).style.position).toBe("absolute");
    expect((anchor.element as HTMLElement).style.left).toBe("12px");
    expect((anchor.element as HTMLElement).style.top).toBe("34px");
    wrapper.unmount();
  });

  it("default 插槽不渲染为锚点内容（锚点为内部固定元素，不占默认插槽）", async () => {
    const wrapper = mount(TableColumnSettings, {
      props: {
        open: true,
        anchorStyle: { position: "absolute", width: "0", height: "0", left: "0px", top: "0px" },
      },
      slots: { default: () => h("div", { id: "panel-content" }, "面板内容") },
      attachTo: document.body,
    });
    await flushPromises();
    // 面板内容出现在 content 区，而非 0x0 锚点内部
    const anchor = wrapper.find("[data-column-settings-anchor]");
    expect(anchor.find("#panel-content").exists()).toBe(false);
    await vi.waitFor(() => expect(popoverContent()!.textContent).toContain("面板内容"));
    wrapper.unmount();
  });
});
