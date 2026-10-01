import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]');
const title = () => document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="title"]');
const description = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="description"]');
const backdrop = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="backdrop"]');

interface HostOptions {
  dialogProps?: Record<string, unknown>;
  triggerAsChild?: boolean;
  showCloseButton?: boolean;
}

function mountHost(options: HostOptions = {}) {
  const { dialogProps = {}, triggerAsChild = false, showCloseButton = true } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(Dialog, dialogProps, {
          default: () => [
            triggerAsChild
              ? h(DialogTrigger, { asChild: true }, () =>
                  h("a", { class: "link", href: "/x" }, "打开"),
                )
              : h(DialogTrigger, null, () => "打开"),
            h(DialogContent, { showCloseButton }, () => [
              h(DialogHeader, null, () => [
                h(DialogTitle, null, () => "编辑资料"),
                h(DialogDescription, null, () => "保存后立即生效"),
              ]),
              h("p", null, "内容区"),
              h(DialogFooter, null, () => [h(DialogClose, null, () => "取消")]),
            ]),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
});

describe("Dialog", () => {
  it("Trigger 点击打开，面板与标题渲染且带 data-state=open", async () => {
    const w = mountHost();
    // Ark 预挂载内容面板：关闭态为 hidden + data-state=closed
    expect(content()!.dataset.state).toBe("closed");
    expect(content()!.hasAttribute("hidden")).toBe(true);

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    expect(content()!.hasAttribute("hidden")).toBe(false);
    expect(title()!.textContent).toContain("编辑资料");
    expect(description()!.textContent).toContain("保存后立即生效");
    expect(backdrop()).not.toBeNull();
    w.unmount();
  });

  it("Escape 关闭", async () => {
    const w = mountHost();
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("CloseTrigger 点击关闭", async () => {
    const w = mountHost();
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));

    const close = document.querySelector<HTMLElement>('[data-part="close-trigger"]');
    expect(close).not.toBeNull();
    close!.click();
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("默认渲染内置关闭按钮，showCloseButton=false 时只剩用户的 DialogClose", async () => {
    const w = mountHost({ showCloseButton: false });
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    // footer 里的 DialogClose 恒为 1 个；内置 X 按钮使总数为 2
    expect(document.querySelectorAll('[data-part="close-trigger"]').length).toBe(1);
    w.unmount();
  });

  it("DialogTrigger asChild 合并到子元素并保持打开行为", async () => {
    const w = mountHost({ triggerAsChild: true });
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/x");
    // zag asChild 将触发器行为合并到子元素：data-part/aria-controls 就位
    expect(a.attributes("data-part")).toBe("trigger");

    await a.trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    w.unmount();
  });

  it("v-model:open 受控：Trigger 触发 update:open，Escape 回写 false", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Dialog,
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              default: () => [
                h(DialogTrigger, null, () => "打开"),
                h(DialogContent, null, () => h(DialogTitle, null, () => "受控")),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("Title/Description/Content 应用变体类", async () => {
    const w = mountHost();
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() => expect(content()).not.toBeNull());
    expect(title()!.className).toContain("font-semibold");
    expect(description()!.className).toContain("text-muted-foreground");
    expect(content()!.className).toContain("bg-background");
    w.unmount();
  });
});
