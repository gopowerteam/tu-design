import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { ContextMenu } from "./index";
// items 类型与 dropdown-menu 同构，直接复用其定义
import type { MenuItemOption } from "../dropdown-menu/types";

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
    label: "危险区",
    children: [{ type: "item", value: "delete", label: "删除", class: "text-destructive" }],
  },
];

function mountMenu(
  options: { items?: MenuItemOption[]; onSelect?: (d: { value: string }) => void } = {},
) {
  const { items = baseItems, onSelect } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          ContextMenu,
          { items, ...(onSelect ? { onSelect } : {}) },
          { default: () => h("button", "右键我") },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 在触发元素上派发右键事件并等待面板就绪（zag 的 onContextMenu 绑定在 jsdom 可直接触发开合） */
async function openByContextMenu(w: {
  find: (s: string) => { trigger: (e: string) => Promise<void> };
}) {
  await w.find('[data-part="context-trigger"]').trigger("contextmenu");
  await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
}

describe("ContextMenu", () => {
  it("右键触发元素打开菜单，按 items 渲染 item/label/separator/group", async () => {
    const w = mountMenu();
    await openByContextMenu(w);

    expect(items().length).toBe(3);
    expect(content()?.textContent).toContain("操作");
    expect(document.querySelectorAll('[data-part="separator"]').length).toBe(1);
    expect(document.querySelector('[data-part="item-group"]')).toBeTruthy();
    w.unmount();
  });

  it("禁用项与危险项按描述渲染（data-disabled / class 保留）", async () => {
    const w = mountMenu({
      items: [
        { type: "item", value: "edit", label: "编辑" },
        { type: "item", value: "share", label: "分享", disabled: true },
        { type: "item", value: "delete", label: "删除", class: "text-destructive" },
      ],
    });
    await openByContextMenu(w);

    const share = [...items()].find((el) => el.textContent?.includes("分享"))!;
    expect(share.getAttribute("data-disabled")).not.toBeNull();
    const del = [...items()].find((el) => el.textContent?.includes("删除"))!;
    expect(del.className).toContain("text-destructive");
    w.unmount();
  });

  it("选中 item 触发 select（含 value）并关闭菜单", async () => {
    const onSelect = vi.fn();
    const w = mountMenu({ onSelect });
    await openByContextMenu(w);

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

  it("禁用项点击不触发 select 也不关闭菜单", async () => {
    const onSelect = vi.fn();
    const w = mountMenu({
      onSelect,
      items: [
        { type: "item", value: "edit", label: "编辑" },
        { type: "item", value: "share", label: "分享", disabled: true },
      ],
    });
    await openByContextMenu(w);

    const share = [...items()].find((el) => el.textContent?.includes("分享"))!;
    share.click();
    await new Promise((r) => setTimeout(r, 60));
    expect(onSelect).not.toHaveBeenCalled();
    expect(content()?.dataset.state).toBe("open");
    w.unmount();
  });

  it("默认插槽即触发元素（ContextTrigger as-child 透传，右键绑定存在）", async () => {
    const w = mountMenu({
      items: [{ type: "item", value: "edit", label: "编辑" }],
    });
    // asChild：触发语义直接合并到插槽元素上，不额外包裹
    const btn = w.find("button");
    expect(btn.exists()).toBe(true);
    expect(btn.attributes("data-part")).toBe("context-trigger");
    expect(btn.attributes("data-scope")).toBe("menu");

    // a11y：ark menu 的 role=menu 语义保留在面板上
    await openByContextMenu(w);
    expect(content()?.getAttribute("role")).toBe("menu");
    w.unmount();
  });
});
