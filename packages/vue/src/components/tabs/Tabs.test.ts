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

  it("键盘 → 导航切换（automatic 聚焦即切换）", async () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    // keydown 监听在 List 上，须派发冒泡事件
    triggers()[0]!.focus();
    triggers()[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await vi.waitFor(() => {
      expect(triggers()[1]!.hasAttribute("data-selected")).toBe(true);
      expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("activation-mode=manual：→ 仅移焦点，点击才激活", async () => {
    const w = mountTabs({ props: { defaultValue: "account", activationMode: "manual" } });

    triggers()[0]!.focus();
    triggers()[0]!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await new Promise((r) => setTimeout(r, 40));
    // 焦点已移动但未激活（zag 的 manual 模式聚焦不选中；浏览器中 Enter/Space 经按钮原生 click 确认）
    expect(document.activeElement).toBe(triggers()[1]);
    expect(triggers()[1]!.hasAttribute("data-selected")).toBe(false);
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);

    triggers()[1]!.click();
    await vi.waitFor(() => {
      expect(triggers()[1]!.hasAttribute("data-selected")).toBe(true);
      expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("根元素 class 透传", () => {
    const w = mountTabs({ props: { defaultValue: "account", class: "w-96" } });

    const root = document.querySelector('[data-scope="tabs"][data-part="root"]');
    expect(root?.className).toContain("w-96");
    w.unmount();
  });

  it("面板携带 zag 语义的 data-selected", async () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    expect(contentBy("账户内容")!.hasAttribute("data-selected")).toBe(true);
    expect(contentBy("密码内容")!.hasAttribute("data-selected")).toBe(false);

    triggers()[1]!.click();
    await vi.waitFor(() => {
      expect(contentBy("密码内容")!.hasAttribute("data-selected")).toBe(true);
      expect(contentBy("账户内容")!.hasAttribute("data-selected")).toBe(false);
    });
    w.unmount();
  });

  it("#trigger 插槽自定义渲染，缺省回落 label", () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tabs,
            { items: baseItems, defaultValue: "account" },
            {
              trigger: ({ item }: { item: MountItem }) =>
                item.value === "account"
                  ? h("span", { class: "i-lucide-home" })
                  : h("span", item.label),
              panel: renderPanel,
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    expect(triggers()[0]!.textContent).not.toContain("账户");
    expect(triggers()[0]!.querySelector(".i-lucide-home")).toBeTruthy();
    expect(triggers()[1]!.textContent).toContain("密码");
    w.unmount();
  });

  it("orientation=vertical：属性透传 + 纵向样式 + ↑ 键导航", async () => {
    const w = mountTabs({ props: { defaultValue: "password", orientation: "vertical" } });

    const list = document.querySelector('[data-scope="tabs"][data-part="list"]');
    expect(list!.getAttribute("data-orientation")).toBe("vertical");
    expect(triggers()[0]!.className).toContain("justify-start");

    triggers()[1]!.focus();
    triggers()[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    await vi.waitFor(() => {
      expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true);
      expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("受控严格跟随 value：父不回写时 UI 不切换，仅发出事件", async () => {
    const onUpdate = vi.fn();
    const w = mountTabs({ props: { value: "account", "onUpdate:value": onUpdate } });

    triggers()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("password"));
    await new Promise((r) => setTimeout(r, 40));
    // value 未回写前 UI 严格保持 account
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);
    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    w.unmount();
  });

  it("#prefix/#suffix 插槽渲染于标签栏两端", () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tabs,
            { items: baseItems, defaultValue: "account" },
            {
              prefix: () => h("span", { class: "bar-prefix" }, "前缀"),
              suffix: () => h("button", { class: "bar-suffix" }, "关闭全部"),
              panel: renderPanel,
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    const header = document.querySelector('[data-part="list"]')!.parentElement!;
    expect(header.className).toContain("flex items-center");
    expect(header.querySelector(".bar-prefix")!.textContent).toBe("前缀");
    expect(header.querySelector(".bar-suffix")!.textContent).toBe("关闭全部");
    w.unmount();
  });

  it("无插槽时标签栏容器为 display:contents（布局零回归）", () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    const header = document.querySelector('[data-part="list"]')!.parentElement!;
    expect(header.className).toContain("contents");
    w.unmount();
  });

  it("closable 项渲染关闭按钮，非 closable 项不渲染", () => {
    const items = [
      { value: "a", label: "甲", closable: true },
      { value: "b", label: "乙" },
    ];
    const w = mountTabs({ props: { defaultValue: "a" }, items });

    const closeBtns = document.querySelectorAll('[role="button"][aria-label^="关闭"]');
    expect(closeBtns).toHaveLength(1);
    expect(closeBtns[0]!.getAttribute("aria-label")).toBe("关闭 甲");
    w.unmount();
  });

  it("点击未激活 tab 的关闭钮：发出 close 且不触发选中", async () => {
    const onUpdate = vi.fn();
    const onClose = vi.fn();
    const items = [
      { value: "account", label: "账户" },
      { value: "password", label: "密码", closable: true },
    ];
    const w = mountTabs({
      props: { defaultValue: "account", "onUpdate:value": onUpdate, onClose },
      items,
    });

    const closeBtn = triggers()[1]!.querySelector<HTMLElement>('[role="button"]')!;
    closeBtn.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    closeBtn.click();
    await new Promise((r) => setTimeout(r, 40));
    // mousedown.prevent 阻断焦点转移，automatic 模式不得经 onFocus 选中
    expect(onClose).toHaveBeenCalledWith("password");
    expect(onUpdate).not.toHaveBeenCalled();
    expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true);
    w.unmount();
  });

  it("点击已激活 tab 的关闭钮：发出 close，选中态不变", async () => {
    const onClose = vi.fn();
    const items = [{ value: "account", label: "账户", closable: true }, ...baseItems.slice(1)];
    const w = mountTabs({ props: { defaultValue: "account", onClose }, items });

    triggers()[0]!.querySelector<HTMLElement>('[role="button"]')!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onClose).toHaveBeenCalledWith("account");
    expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true);
    w.unmount();
  });

  it("非受控：激活项被移除后自动选中前一个邻居", async () => {
    const items = ref([
      { value: "a", label: "甲" },
      { value: "b", label: "乙" },
      { value: "c", label: "丙" },
    ]);
    const Host = defineComponent({
      setup() {
        return () => h(Tabs, { items: items.value, defaultValue: "b" }, { panel: renderPanel });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items.value = [items.value[0]!, items.value[2]!]; // 删除激活项 b
    await vi.waitFor(() => {
      expect(triggers()).toHaveLength(2);
      expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true); // 前一个 a
      expect(contentBy("甲内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("非受控：全部关闭后进入无选中态", async () => {
    const items = ref(baseItems.map((i) => ({ ...i, closable: true })));
    const Host = defineComponent({
      setup() {
        return () =>
          h(Tabs, { items: items.value, defaultValue: "account" }, { panel: renderPanel });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items.value = [];
    await vi.waitFor(() => expect(triggers()).toHaveLength(0));
    w.unmount();
  });

  it("before-leave 同步 false 阻止切换", async () => {
    const onUpdate = vi.fn();
    const beforeLeave = vi.fn(() => false);
    const w = mountTabs({
      props: { defaultValue: "account", beforeLeave, "onUpdate:value": onUpdate },
    });

    triggers()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(beforeLeave).toHaveBeenCalledWith("password", "account");
    expect(onUpdate).not.toHaveBeenCalled();
    expect(triggers()[1]!.hasAttribute("data-selected")).toBe(false);
    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    w.unmount();
  });

  it("before-leave 异步拒绝：等待期与拒绝后 UI 均保持旧态", async () => {
    let resolveGuard!: (v: boolean) => void;
    const beforeLeave = vi.fn(() => new Promise<boolean>((r) => (resolveGuard = r)));
    const w = mountTabs({ props: { defaultValue: "account", beforeLeave } });

    triggers()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    // 等待期保持旧态
    expect(triggers()[1]!.hasAttribute("data-selected")).toBe(false);
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);
    resolveGuard(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(triggers()[1]!.hasAttribute("data-selected")).toBe(false);
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);
    w.unmount();
  });

  it("before-leave 异步放行正常切换", async () => {
    let resolveGuard!: (v: boolean) => void;
    const beforeLeave = () => new Promise<boolean>((r) => (resolveGuard = r));
    const onUpdate = vi.fn();
    const w = mountTabs({
      props: { defaultValue: "account", beforeLeave, "onUpdate:value": onUpdate },
    });

    triggers()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    resolveGuard(true);
    await vi.waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith("password");
      expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false);
    });
    w.unmount();
  });

  it("before-leave 拦截 deselectable 取消选中（next=null）", async () => {
    const beforeLeave = vi.fn(() => false);
    const w = mountTabs({
      props: { defaultValue: "account", deselectable: true, beforeLeave },
    });

    triggers()[0]!.click(); // 点击已激活项 → zag 尝试取消选中
    await new Promise((r) => setTimeout(r, 40));
    expect(beforeLeave).toHaveBeenCalledWith(null, "account");
    expect(triggers()[0]!.hasAttribute("data-selected")).toBe(true);
    w.unmount();
  });

  it("type=line：List/Trigger 切换为下划线款式", () => {
    const w = mountTabs({ props: { defaultValue: "account", type: "line" } });

    const list = document.querySelector('[data-part="list"]')!;
    // relative 为 Indicator 的 absolute 定位锚点
    expect(list.className).toContain("relative");
    expect(list.className).toContain("border-b");
    expect(list.className).not.toContain("bg-muted");
    expect(triggers()[0]!.className).not.toContain("data-[selected]:bg-background");
    expect(triggers()[0]!.className).toContain("data-[selected]:text-foreground");
    w.unmount();
  });

  it("type=line：Indicator 存在于 List 内（jsdom 无布局恒 hidden）", () => {
    const w = mountTabs({ props: { defaultValue: "account", type: "line" } });

    const indicator = document
      .querySelector('[data-part="list"]')!
      .querySelector('[data-part="indicator"]');
    expect(indicator).toBeTruthy();
    expect(indicator!.hasAttribute("hidden")).toBe(true);
    w.unmount();
  });

  it("type 默认 segment：无 Indicator，样式零回归", () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    expect(document.querySelector('[data-part="indicator"]')).toBeNull();
    expect(triggers()[0]!.className).toContain("data-[selected]:bg-background");
    w.unmount();
  });

  it("placement=bottom：Root 纵向反转且方向保持 horizontal", () => {
    const w = mountTabs({ props: { defaultValue: "account", placement: "bottom" } });

    const root = document.querySelector('[data-scope="tabs"][data-part="root"]')!;
    expect(root.className).toContain("flex-col-reverse");
    expect(document.querySelector('[data-part="list"]')!.getAttribute("data-orientation")).toBe(
      "horizontal",
    );
    w.unmount();
  });

  it("placement=right：Root 横向反转且 ↑/↓ 导航生效", async () => {
    const w = mountTabs({ props: { defaultValue: "account", placement: "right" } });

    const root = document.querySelector('[data-scope="tabs"][data-part="root"]')!;
    expect(root.className).toContain("flex-row-reverse");
    expect(document.querySelector('[data-part="list"]')!.getAttribute("data-orientation")).toBe(
      "vertical",
    );

    // 方向派生：vertical → ↑/↓ 键盘导航
    triggers()[0]!.focus();
    triggers()[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await vi.waitFor(() => {
      expect(triggers()[1]!.hasAttribute("data-selected")).toBe(true);
    });
    w.unmount();
  });

  it("默认 placement 不加布局类（零回归）", () => {
    const w = mountTabs({ props: { defaultValue: "account" } });

    const root = document.querySelector('[data-scope="tabs"][data-part="root"]')!;
    expect(root.className).not.toContain("flex-col-reverse");
    expect(root.className).not.toContain("flex-row-reverse");
    w.unmount();
  });

  it("animated：激活面板携带淡入动画类", () => {
    const w = mountTabs({ props: { defaultValue: "account", animated: true } });

    expect(contentBy("账户内容")!.className).toContain("tu-tabs-fade-in");
    w.unmount();

    const w2 = mountTabs({ props: { defaultValue: "account" } });
    expect(contentBy("账户内容")!.className).not.toContain("tu-tabs-fade-in");
    w2.unmount();
  });
});
