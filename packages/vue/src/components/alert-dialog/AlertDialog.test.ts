import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { AlertDialog } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]');

interface Slots {
  default?: () => unknown;
  title?: () => unknown;
  description?: () => unknown;
}

/** 受控打开（open ref + v-model 双向回写）的宿主，返回 open ref 便于断言锁定语义 */
function mountOpen(
  props: Record<string, unknown> = {},
  listeners: Record<string, (...args: unknown[]) => unknown> = {},
  slots: Slots = {},
) {
  const open = ref(true);
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          AlertDialog,
          {
            open: open.value,
            "onUpdate:open": (v: boolean) => (open.value = v),
            ...props,
            ...listeners,
          },
          slots as never,
        );
    },
  });
  const w = mount(Host, { attachTo: document.body });
  return { w, open };
}

async function waitOpen() {
  await vi.waitFor(() => {
    const el = content();
    expect(el).not.toBeNull();
    expect(el!.dataset.state).toBe("open");
  });
}

async function waitClosed(open: { value: boolean }) {
  await vi.waitFor(() => {
    expect(open.value).toBe(false);
    const el = content();
    expect(el === null || el.dataset.state === "closed").toBe(true);
  });
}

const pressEscape = () => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
const pressOutside = () =>
  document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));

const findButtons = (w: ReturnType<typeof mount>) => w.findAll("button");
// 取消在前、确认在后；确认钮始终渲染在取消之后，故取末位按钮
const confirmBtn = (w: ReturnType<typeof mount>) => findButtons(w).at(-1)!;
const cancelBtn = (w: ReturnType<typeof mount>) => findButtons(w).at(-2)!;

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
});

describe("AlertDialog", () => {
  it("渲染 title/description 与双按钮；点击确认 emit confirm 并自动关闭", async () => {
    const onConfirm = vi.fn();
    const { w, open } = mountOpen(
      { title: "删除确认", description: "该操作不可撤销" },
      { onConfirm },
    );
    await waitOpen();
    expect(content()!.textContent).toContain("删除确认");
    expect(content()!.textContent).toContain("该操作不可撤销");

    await confirmBtn(w).trigger("click");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitClosed(open);
    w.unmount();
  });

  it("点击取消 emit cancel 并自动关闭", async () => {
    const onCancel = vi.fn();
    const { w, open } = mountOpen({ title: "确认" }, { onCancel });
    await waitOpen();

    await cancelBtn(w).trigger("click");
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitClosed(open);
    w.unmount();
  });

  it("a11y：内容节点 role=alertdialog + aria-modal=true，aria-labelledby 指向标题", async () => {
    const { w } = mountOpen({ title: "确认标题", description: "描述" });
    await waitOpen();
    const el = content()!;
    expect(el.getAttribute("role")).toBe("alertdialog");
    expect(el.getAttribute("aria-modal")).toBe("true");
    const titleEl = document.querySelector<HTMLElement>('[data-part="title"]')!;
    expect(el.getAttribute("aria-labelledby")).toBe(titleEl.id);
    w.unmount();
  });

  it("confirmText/cancelText 自定义按钮文案", async () => {
    const { w } = mountOpen({ title: "确认", confirmText: "删除", cancelText: "再想想" });
    await waitOpen();
    const texts = findButtons(w).map((b) => b.text());
    expect(texts.join("|")).toContain("删除");
    expect(texts.join("|")).toContain("再想想");
    w.unmount();
  });

  it("confirm 返回 Promise：pending 时按钮 loading 且 ESC/遮罩/取消全部锁定", async () => {
    let resolveFn: (() => void) | undefined;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => (resolveFn = resolve)));
    const onCancel = vi.fn();
    const { w, open } = mountOpen({ title: "异步确认" }, { onConfirm, onCancel });
    await waitOpen();

    await confirmBtn(w).trigger("click");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(confirmBtn(w).attributes("disabled")).toBeDefined());
    expect(cancelBtn(w).attributes("disabled")).toBeDefined();

    // pending 期间：ESC、遮罩点击、取消按钮均不关闭
    pressEscape();
    pressOutside();
    await cancelBtn(w).trigger("click");
    expect(onCancel).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 30));
    expect(open.value).toBe(true);
    expect(content()!.dataset.state).toBe("open");

    resolveFn!();
    await waitClosed(open);
    w.unmount();
  });

  it("confirm Promise resolve 后自动关闭", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const { w, open } = mountOpen({ title: "异步确认" }, { onConfirm });
    await waitOpen();

    await confirmBtn(w).trigger("click");
    await waitClosed(open);
    w.unmount();
  });

  it("confirm Promise reject：保持打开且退出 loading，可再次确认", async () => {
    let rejectFn: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectFn = () => reject(new Error("failed"));
        }),
    );
    const { w, open } = mountOpen({ title: "异步确认" }, { onConfirm });
    await waitOpen();

    await confirmBtn(w).trigger("click");
    rejectFn!();
    await vi.waitFor(() => expect(confirmBtn(w).attributes("disabled")).toBeUndefined());
    expect(open.value).toBe(true);
    expect(content()!.dataset.state).toBe("open");

    // 退出 loading 后关闭通道恢复：ESC 可正常关闭
    pressEscape();
    await waitClosed(open);
    w.unmount();
  });

  it("同步 confirm 处理器直接关闭（无 loading 停留）", async () => {
    const onConfirm = vi.fn();
    const { w, open } = mountOpen({ title: "同步确认" }, { onConfirm });
    await waitOpen();

    await confirmBtn(w).trigger("click");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitClosed(open);
    expect(confirmBtn(w).attributes("disabled")).toBeUndefined();
    w.unmount();
  });

  it("destructive：确认按钮切换 destructive 语义样式", async () => {
    const { w } = mountOpen({ title: "危险操作", destructive: true });
    await waitOpen();
    expect(confirmBtn(w).classes()).toContain("bg-destructive");

    w.unmount();
    const { w: w2 } = mountOpen({ title: "普通操作" });
    await waitOpen();
    expect(confirmBtn(w2).classes()).toContain("bg-primary");
    expect(confirmBtn(w2).classes()).not.toContain("bg-destructive");
    w2.unmount();
  });

  it("取消按钮为 outline 变体", async () => {
    const { w } = mountOpen({ title: "确认" });
    await waitOpen();
    expect(cancelBtn(w).classes()).toContain("border-input");
    w.unmount();
  });
});
