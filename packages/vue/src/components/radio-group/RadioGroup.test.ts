import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { RadioGroup as ArkRadioGroup } from "@ark-ui/vue/radio-group";
import { RadioGroup } from "./index";

const items = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item"]'),
];
const itemControls = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item-control"]'),
];
const rootEl = () =>
  document.querySelector<HTMLElement>('[data-scope="radio-group"][data-part="root"]');
const hiddenInputs = () => [
  // zag 的隐藏 input 不带 data-part，只有 data-ownedby；用组 root 内的 radio input 定位
  ...document.querySelectorAll<HTMLInputElement>('[data-part="root"] input[type="radio"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="radio-group"]').forEach((n) => n.remove());
});

const baseItems = [
  { label: "每周", value: "weekly" },
  { label: "每月", value: "monthly" },
];

function mountGroup(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(RadioGroup, { items: baseItems, ...props });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("RadioGroup", () => {
  it("items 数据驱动渲染选项文本与圆形控件", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.textContent).toContain("每周");
    expect(items()[1]!.textContent).toContain("每月");
    expect(items()[0]!.className).toContain("flex");
    expect(items()[0]!.className).toContain("items-center");
    expect(itemControls()[0]!.className).toContain("rounded-full");
    w.unmount();
  });

  it("点击选中并发出 update:value，单选互斥", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ "onUpdate:value": onUpdate });

    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    items()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("monthly"));
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("defaultValue 初始选中", async () => {
    const w = mountGroup({ defaultValue: "weekly" });
    await vi.waitFor(() => expect(itemControls()[0]!.dataset.state).toBe("checked"));
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("weekly");
    const Host = defineComponent({
      setup() {
        return () =>
          h(RadioGroup, {
            items: baseItems,
            value: value.value,
            "onUpdate:value": (v: string) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("monthly"));
    w.unmount();
  });

  it("不传 value 且不监听事件时点击仍可切换（内部 ref 非受控语义）", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("items 项 disabled 不可选，其余可选", async () => {
    const onUpdate = vi.fn();
    const w = mount(RadioGroup, {
      props: {
        items: [
          { label: "每周", value: "weekly" },
          { label: "每月", value: "monthly", disabled: true },
        ],
        "onUpdate:value": onUpdate,
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(itemControls()[1]!.dataset.state).toBe("unchecked");

    items()[0]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("weekly"));
    w.unmount();
  });

  it("整组 disabled 全部不可选", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ disabled: true, "onUpdate:value": onUpdate });
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[0]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("#item 插槽接管单项渲染，作用域提供 item 与 checked，隐藏 input 保留", async () => {
    const w = mount(RadioGroup, {
      props: { items: baseItems, name: "plan" },
      slots: {
        item: ({ item, checked }: { item: { label: string; value: string }; checked: boolean }) =>
          h("span", { "data-testid": "custom-item" }, `${item.label}-${checked}`),
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    // 内置圆点控件不再渲染，自定义内容生效
    expect(itemControls().length).toBe(0);
    expect(document.body.textContent).toContain("每周-false");

    items()[1]!.click();
    await vi.waitFor(() => expect(document.body.textContent).toContain("每月-true"));

    // 表单语义不丢失：隐藏 input 仍随 items 渲染
    expect(hiddenInputs().length).toBe(2);
    expect(hiddenInputs()[0]!.name).toBe("plan");
    w.unmount();
  });

  it("item.class 应用到选项根元素", async () => {
    const w = mount(RadioGroup, {
      props: {
        items: [{ label: "每周", value: "weekly", class: "text-primary" }, baseItems[1]!],
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.className).toContain("text-primary");
    expect(items()[1]!.className).not.toContain("text-primary");
    w.unmount();
  });

  it("invalid=true 时 root 与 item-control 级联 data-invalid，控件带 destructive 样式", async () => {
    const w = mountGroup({ invalid: true });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
    expect(itemControls()[0]!.hasAttribute("data-invalid")).toBe(true);
    expect(itemControls()[0]!.className).toContain("data-invalid:border-destructive");
    w.unmount();
  });

  it("name 透传到隐藏 input，供原生表单提交", async () => {
    const w = mountGroup({ name: "plan" });
    await vi.waitFor(() => expect(hiddenInputs().length).toBe(2));
    expect(hiddenInputs()[0]!.name).toBe("plan");
    expect(hiddenInputs()[0]!.type).toBe("radio");
    w.unmount();
  });

  it("required/readOnly 透传", async () => {
    const w = mountGroup({ required: true, readOnly: true });
    await vi.waitFor(() => expect(hiddenInputs().length).toBe(2));
    expect(hiddenInputs()[0]!.required).toBe(true);
    expect(rootEl()!.getAttribute("aria-readonly")).toBe("true");
    w.unmount();
  });

  it("horizontal 方向根元素应用水平排列类", () => {
    const w = mount(RadioGroup, {
      props: { items: baseItems, orientation: "horizontal" },
      attachTo: document.body,
    });
    const root = rootEl()!;
    expect(root.className).toContain("grid-flow-col");
    expect(root.className).toContain("auto-cols-max");
    w.unmount();

    const w2 = mount(RadioGroup, { props: { items: baseItems }, attachTo: document.body });
    const root2 = rootEl()!;
    expect(root2.className).not.toContain("grid-flow-col");
    w2.unmount();
  });

  it("ids 全量覆盖（无冒号）：root/label/indicator 派生自 useId", () => {
    const w = mountGroup();
    const ids = w.findComponent(ArkRadioGroup.Root)!.props("ids") as Record<string, string>;
    for (const part of ["root", "label", "indicator"]) {
      expect(typeof ids[part]).toBe("string");
      expect(ids[part]).not.toContain(":");
    }
    expect(rootEl()!.id).toBe(ids.root);
    w.unmount();
  });

  it("attrs.id 同步为 ids.root 缺省覆盖，用户显式 ids.root 优先", () => {
    const w1 = mountGroup({ id: "rg-root" });
    const ids1 = w1.findComponent(ArkRadioGroup.Root)!.props("ids") as Record<string, string>;
    expect(ids1.root).toBe("rg-root");
    w1.unmount();

    const w2 = mountGroup({ id: "rg-root-2", ids: { root: "explicit-root" } });
    const ids2 = w2.findComponent(ArkRadioGroup.Root)!.props("ids") as Record<string, string>;
    expect(ids2.root).toBe("explicit-root");
    w2.unmount();
  });

  it("default 外观保持圆点，焦点/禁用样式走 data 属性", async () => {
    const w = mountGroup();
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.className).toContain("items-center");
    expect(itemControls()[0]!.querySelector(".rounded-full")).not.toBeNull();
    expect(itemControls()[0]!.className).toContain("data-[focus-visible]:ring-[3px]");
    expect(itemControls()[0]!.className).not.toContain("focus-visible:ring-[3px]");
    expect(itemControls()[0]!.className).not.toContain("disabled:cursor-not-allowed");
    w.unmount();
  });
});

describe("RadioGroup segmented 外观", () => {
  it("根元素为分段轨道，选项为等宽按钮且不渲染圆点", async () => {
    const w = mountGroup({ variant: "segmented" });
    await vi.waitFor(() => expect(items().length).toBe(2));

    expect(rootEl()!.className).toContain("inline-flex");
    expect(rootEl()!.className).toContain("bg-muted");
    expect(items()[0]!.className).toContain("flex-1");
    expect(items()[0]!.className).toContain("min-w-0");
    expect(items()[0]!.className).toContain("rounded-md");
    expect(items()[0]!.className).toContain("h-8");
    // 长文案在窄容器内省略而非换行撑破固定高度
    expect(items()[0]!.querySelector('[data-part="item-text"]')!.className).toContain("truncate");
    // ItemControl 保留 part 结构但不再渲染圆点
    expect(itemControls().length).toBe(2);
    expect(itemControls()[0]!.children.length).toBe(0);
    expect(itemControls()[0]!.className).toContain("sr-only");
    w.unmount();
  });

  it("点击选中后按钮进入 checked 态并带主色填充类", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ variant: "segmented", "onUpdate:value": onUpdate });
    await vi.waitFor(() => expect(items().length).toBe(2));

    items()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("monthly"));
    await vi.waitFor(() => expect(items()[1]!.dataset.state).toBe("checked"));
    expect(items()[1]!.className).toContain("data-[state=checked]:bg-primary");
    expect(items()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("size 映射按钮高度刻度", async () => {
    const w = mountGroup({ variant: "segmented", size: "sm" });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.className).toContain("h-7");
    w.unmount();

    const w2 = mountGroup({ variant: "segmented", size: "lg" });
    await vi.waitFor(() => expect(items().length).toBe(2));
    expect(items()[0]!.className).toContain("h-9");
    w2.unmount();
  });

  it("单项 disabled 不响应点击，hover 类排除禁用项", async () => {
    const onUpdate = vi.fn();
    const w = mount(RadioGroup, {
      props: {
        variant: "segmented",
        items: [
          { label: "每周", value: "weekly" },
          { label: "每月", value: "monthly", disabled: true },
        ],
        "onUpdate:value": onUpdate,
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    expect(items()[1]!.className).toContain("data-[disabled]:opacity-50");
    expect(items()[1]!.className).toContain("not-data-[disabled]");
    items()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("invalid 时轨道与选项级联 data-invalid，destructive 仅作用于选中项", async () => {
    const w = mountGroup({ variant: "segmented", invalid: true });
    await vi.waitFor(() => expect(items().length).toBe(2));

    expect(rootEl()!.hasAttribute("data-invalid")).toBe(true);
    expect(items()[0]!.hasAttribute("data-invalid")).toBe(true);
    const classes = items()[0]!.className.split(/\s+/);
    expect(classes).toContain("data-[state=checked]:data-[invalid]:bg-destructive");
    expect(classes).not.toContain("data-[invalid]:bg-destructive");
    w.unmount();
  });

  it("segmented 未传 orientation 时默认水平，显式 vertical 覆盖", async () => {
    const w = mountGroup({ variant: "segmented" });
    expect(w.findComponent(ArkRadioGroup.Root)!.props("orientation")).toBe("horizontal");
    w.unmount();

    const w2 = mountGroup({ variant: "segmented", orientation: "vertical" });
    expect(w2.findComponent(ArkRadioGroup.Root)!.props("orientation")).toBe("vertical");
    expect(rootEl()!.className).toContain("flex-col");
    w2.unmount();
  });

  it("#item 插槽接管内容，隐藏 input 仍保留", async () => {
    const w = mount(RadioGroup, {
      props: { variant: "segmented", items: baseItems, name: "plan" },
      slots: {
        item: ({ item }: { item: { label: string; value: string } }) =>
          h("span", { "data-testid": "custom-item" }, item.label),
      },
      attachTo: document.body,
    });
    await vi.waitFor(() => expect(items().length).toBe(2));

    expect(itemControls().length).toBe(0);
    expect(document.body.textContent).toContain("每周");
    expect(hiddenInputs().length).toBe(2);
    expect(hiddenInputs()[0]!.name).toBe("plan");
    w.unmount();
  });

  it("class=w-full 经 twMerge 覆盖 w-fit", async () => {
    const w = mountGroup({ variant: "segmented", class: "w-full" });
    await vi.waitFor(() => expect(items().length).toBe(2));

    expect(rootEl()!.className).toContain("w-full");
    expect(rootEl()!.className).not.toContain("w-fit");
    w.unmount();
  });
});
