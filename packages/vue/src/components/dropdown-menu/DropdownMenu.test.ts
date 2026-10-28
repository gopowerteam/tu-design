import { mount } from "@vue/test-utils";
import type { FunctionalComponent } from "vue";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DropdownMenu } from "./index";
import type { MenuItemOption } from "./types";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="menu"][data-part="content"]');
const items = () => document.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="menu"]').forEach((n) => n.remove());
});

const baseItems: MenuItemOption[] = [
  { type: "label", label: "操作" },
  { type: "item", value: "edit", label: "编辑" },
  { type: "item", value: "share", label: "分享" },
  { type: "separator" },
  {
    type: "group",
    label: "帮助",
    children: [
      { type: "item", value: "docs", label: "使用文档" },
      { type: "separator" },
      { type: "item", value: "support", label: "联系支持" },
    ],
  },
];

interface MountOptions {
  items?: MenuItemOption[];
  menuProps?: Record<string, unknown>;
  /** 默认插槽（触发元素），元素形态时透传语义生效 */
  trigger?: () => ReturnType<typeof h> | string;
  /** #item 插槽 */
  itemSlot?: FunctionalComponent<{ item: Extract<MenuItemOption, { type: "item" }> }>;
}

function mountMenu(options: MountOptions = {}) {
  const {
    items = baseItems,
    menuProps = {},
    trigger = () => h("button", "操作"),
    itemSlot,
  } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          DropdownMenu,
          { items, ...menuProps },
          {
            default: trigger,
            ...(itemSlot ? { item: itemSlot } : {}),
          },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 打开菜单并等待面板就绪 */
async function openMenu(w: { find: (s: string) => { trigger: (e: string) => Promise<void> } }) {
  await w.find('[data-part="trigger"]').trigger("click");
  await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
}

describe("DropdownMenu", () => {
  it("按 items 渲染 item/label/separator/group（含嵌套）", async () => {
    const w = mountMenu();
    await openMenu(w);

    expect(items().length).toBe(4);
    expect(content()?.textContent).toContain("操作");

    // 独立 label（原 DropdownMenuLabel 的视觉样式）
    expect(content()?.querySelector<HTMLElement>(":scope > div")?.textContent?.trim()).toBe("操作");

    // 两条 separator（顶层一条 + group 内一条）
    expect(document.querySelectorAll('[data-part="separator"]').length).toBe(2);

    // group：role=group 且与 label 建立 aria 关联
    const group = document.querySelector<HTMLElement>('[data-part="item-group"]');
    expect(group?.getAttribute("role")).toBe("group");
    const labelledby = group?.getAttribute("aria-labelledby");
    expect(labelledby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toBe("帮助");
    w.unmount();
  });

  it("点击 item 触发 select 并关闭菜单", async () => {
    const onSelect = vi.fn();
    const w = mountMenu({ menuProps: { onSelect } });
    await openMenu(w);

    // zag 的选中依赖 highlightedValue：真实交互是先悬停（pointermove 高亮）再点击
    const pointer = (el: Element, type: string) => {
      const e = new MouseEvent(type, { bubbles: true });
      Object.defineProperty(e, "pointerType", { value: "mouse" });
      el.dispatchEvent(e);
    };
    const edit = [...items()].find((el) => el.textContent?.includes("编辑"))!;
    pointer(edit, "pointerdown");
    pointer(edit, "pointermove");
    edit.click();

    await vi.waitFor(() => expect(onSelect).toHaveBeenCalled());
    expect(onSelect.mock.calls[0]![0].value).toBe("edit");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("disabled item 带标记且点击不关闭菜单", async () => {
    const w = mountMenu({
      items: [
        { type: "item", value: "edit", label: "编辑" },
        { type: "item", value: "share", label: "分享", disabled: true },
      ],
    });
    await openMenu(w);

    const share = [...items()].find((el) => el.textContent?.includes("分享"))!;
    expect(share.getAttribute("data-disabled")).not.toBeNull();
    share.click();
    await new Promise((r) => setTimeout(r, 60));
    expect(content()?.dataset.state).toBe("open");
    w.unmount();
  });

  it("v-model:open 受控", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            DropdownMenu,
            {
              items: [{ type: "item", value: "edit", label: "编辑" }],
              open: open.value,
              "onUpdate:open": (v: boolean) => (open.value = v),
            },
            { default: () => h("button", "操作") },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("默认插槽即触发元素（asChild 透传，无额外包裹）", async () => {
    const w = mountMenu({ trigger: () => h("a", { class: "link", href: "/x" }, "操作") });
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/x");
    expect(a.attributes("data-part")).toBe("trigger");

    await a.trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    w.unmount();
  });

  it("#item 插槽自定义渲染（未提供时回退 label 文案）", async () => {
    const w = mountMenu({
      items: [{ type: "item", value: "edit", label: "编辑" }],
      itemSlot: ({ item }) => h("span", { class: "custom-item" }, `${item.label}！`),
    });
    await openMenu(w);

    const edit = [...items()].find((el) => el.querySelector(".custom-item"));
    expect(edit).toBeTruthy();
    expect(edit?.textContent).toBe("编辑！");

    // 对照：未提供 #item 时回退渲染 label（上一用例的 items 已覆盖，这里补一个未提供的断言）
    w.unmount();
  });

  it("未提供 #item 插槽时回退渲染 item.label", async () => {
    const w = mountMenu({ items: [{ type: "item", value: "edit", label: "编辑" }] });
    await openMenu(w);
    expect(items()[0]?.textContent?.trim()).toBe("编辑");
    w.unmount();
  });
});
