import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Tabs } from "./index";

const triggers = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="trigger"]'),
];
const contents = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="content"]'),
];
const contentBy = (text: string) => contents().find((c) => c.textContent?.includes(text));

afterEach(() => {
  document.body.querySelectorAll('[data-scope="tabs"]').forEach((n) => n.remove());
});

const baseItems = [
  { value: "account", label: "账户" },
  { value: "password", label: "密码" },
];

// #panel 插槽按 item 渲染 "xx内容"，与断言文案对应
function renderPanel({ item }: { item: { label: string } }) {
  return h("div", `${item.label}内容`);
}

interface MountItem {
  value: string;
  label: string;
  disabled?: boolean;
  lazyMount?: boolean;
  unmountOnExit?: boolean;
}

interface MountOptions {
  props?: Record<string, unknown>;
  items?: MountItem[];
}

function mountTabs({ props = {}, items = baseItems }: MountOptions = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Tabs, { items, ...props }, { panel: renderPanel });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Tabs", () => {
  it("items 渲染触发按钮列表与选中态", () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    expect(triggers()).toHaveLength(2);
    expect(triggers()[0]!.textContent).toContain("账户");
    expect(triggers()[1]!.textContent).toContain("密码");
    // zag 的 data-selected 为空串存在属性
    expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true);
    expect(triggers()[1]!.hasAttribute("data-selected")).toBe(false);
    expect(triggers()[0]!.className).toContain("data-[selected]:bg-background");
    w.unmount();
  });

  it("默认展示 defaultValue 面板，点击切换并发出 update:value", async () => {
    const onUpdate = vi.fn();
    const w = mountTabs({ props: { defaultValue: "account", "onUpdate:value": onUpdate } });

    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);

    triggers()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("password"));
    await vi.waitFor(() => {
      expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false);
      expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(true);
    });
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("account");
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tabs,
            {
              items: baseItems,
              value: value.value,
              "onUpdate:value": (v: string) => (value.value = v),
            },
            { panel: renderPanel },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    triggers()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("password"));
    await vi.waitFor(() => expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false));
    w.unmount();
  });

  it("#panel 插槽接收 item 并渲染面板内容", () => {
    const w = mountTabs({ props: { defaultValue: "password" } });

    const panel = contentBy("密码内容")!;
    expect(panel.textContent).toContain("密码内容");
    expect(panel.getAttribute("aria-labelledby")).toContain("password");
    w.unmount();
  });

  it("disabled 项不可切换", async () => {
    const onUpdate = vi.fn();
    const items = [
      { value: "account", label: "账户" },
      { value: "password", label: "密码", disabled: true },
    ];
    const w = mountTabs({ props: { defaultValue: "account", "onUpdate:value": onUpdate }, items });

    expect(triggers()[1]!.hasAttribute("disabled")).toBe(true);
    triggers()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    w.unmount();
  });

  it("item 级 lazyMount/unmountOnExit 逐面板生效", async () => {
    const items = [
      { value: "lazy", label: "懒加载", lazyMount: true, unmountOnExit: true },
      { value: "static", label: "常驻" },
    ];
    const w = mountTabs({ props: { defaultValue: "static" }, items });

    // lazy 面板从未激活不挂载；常驻面板初始挂载
    expect(contentBy("懒加载内容")).toBeUndefined();
    expect(contentBy("常驻内容")!.hasAttribute("hidden")).toBe(false);

    // 激活懒加载面板后挂载；常驻面板保持挂载（仅隐藏）
    triggers()[0]!.click();
    await vi.waitFor(() => {
      expect(contentBy("懒加载内容")).toBeTruthy();
      expect(contentBy("常驻内容")!.hasAttribute("hidden")).toBe(true);
    });
    // 切回常驻：懒加载面板卸载（unmountOnExit），常驻面板恢复可见
    triggers()[1]!.click();
    await vi.waitFor(() => {
      expect(contentBy("懒加载内容")).toBeUndefined();
      expect(contentBy("常驻内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("组件级 lazyMount/unmountOnExit 作为默认值，item 级配置优先", async () => {
    const items = [
      { value: "a", label: "甲" }, // 回落组件级默认
      { value: "b", label: "乙", unmountOnExit: false }, // item 覆盖组件级
    ];
    const w = mountTabs({
      props: { defaultValue: "b", lazyMount: true, unmountOnExit: true },
      items,
    });

    // 甲：组件级 lazyMount 默认生效 → 未激活不挂载
    expect(contentBy("甲内容")).toBeUndefined();
    // 乙：unmountOnExit:false 覆盖组件级 → 激活中正常显示
    expect(contentBy("乙内容")!.hasAttribute("hidden")).toBe(false);

    // 切到甲：首次激活挂载；乙隐藏但保持挂载（item 覆盖生效）
    triggers()[0]!.click();
    await vi.waitFor(() => {
      expect(contentBy("甲内容")).toBeTruthy();
      expect(contentBy("乙内容")!.hasAttribute("hidden")).toBe(true);
    });

    // 切回乙：甲卸载（组件级 unmountOnExit 默认生效）
    triggers()[1]!.click();
    await vi.waitFor(() => {
      expect(contentBy("甲内容")).toBeUndefined();
      expect(contentBy("乙内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });
});
