import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="menu"][data-part="content"]');
const items = () => document.querySelectorAll<HTMLElement>('[data-scope="menu"][data-part="item"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="menu"]').forEach((n) => n.remove());
});

interface HostOptions {
  menuProps?: Record<string, unknown>;
  triggerAsChild?: boolean;
  disabledItem?: boolean;
  onSelect?: (details: { value: string }) => void;
}

function mountMenu(options: HostOptions = {}) {
  const { menuProps = {}, triggerAsChild = false, disabledItem = false, onSelect } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          DropdownMenu,
          { ...menuProps, onSelect },
          {
            default: () => [
              triggerAsChild
                ? h(DropdownMenuTrigger, { asChild: true }, () =>
                    h("a", { class: "link", href: "/x" }, "操作"),
                  )
                : h(DropdownMenuTrigger, null, () => "操作"),
              h(DropdownMenuContent, null, () => [
                h(DropdownMenuLabel, null, () => "操作分组"),
                h(DropdownMenuItem, { value: "edit" }, () => "编辑"),
                disabledItem
                  ? h(DropdownMenuItem, { value: "share", disabled: true }, () => "分享")
                  : h(DropdownMenuItem, { value: "share" }, () => "分享"),
                h(DropdownMenuSeparator),
                h(DropdownMenuItem, { value: "delete" }, () => "删除"),
              ]),
            ],
          },
        );
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("DropdownMenu", () => {
  it("Trigger 点击打开、Escape 关闭", async () => {
    const w = mountMenu();
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(items().length).toBe(3);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("点击 item 触发 select 并关闭菜单", async () => {
    const onSelect = vi.fn();
    const w = mountMenu({ onSelect });
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

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

  it("disabled item 点击不关闭菜单", async () => {
    const w = mountMenu({ disabledItem: true });
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

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
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              default: () => [
                h(DropdownMenuTrigger, null, () => "操作"),
                h(DropdownMenuContent, null, () =>
                  h(DropdownMenuItem, { value: "edit" }, () => "编辑"),
                ),
              ],
            },
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

  it("Trigger asChild 合并到子元素", async () => {
    const w = mountMenu({ triggerAsChild: true });
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/x");
    expect(a.attributes("data-part")).toBe("trigger");

    await a.trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    w.unmount();
  });
});
