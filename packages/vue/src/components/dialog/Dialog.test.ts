import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Dialog } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="content"]');
const title = () => document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="title"]');
const description = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="description"]');
const backdrop = () =>
  document.querySelector<HTMLElement>('[data-scope="dialog"][data-part="backdrop"]');

interface Slots {
  trigger?: () => unknown;
  default?: () => unknown;
  title?: () => unknown;
  description?: () => unknown;
  footer?: (ctx: { close: () => void }) => unknown;
}

function mountDialog(props: Record<string, unknown> = {}, slots: Slots = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Dialog, props, slots as never);
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 全量插槽：#trigger + title/description props + 默认插槽 + #footer(close) */
function mountFull(props: Record<string, unknown> = {}) {
  return mountDialog(
    { title: "编辑资料", description: "保存后立即生效", ...props },
    {
      trigger: () => h("button", { type: "button", class: "open-btn" }, "打开"),
      default: () => h("p", { class: "body-text" }, "内容区"),
      footer: ({ close }: { close: () => void }) =>
        h("button", { type: "button", class: "cancel-btn", onClick: close }, "取消"),
    },
  );
}

async function openDialog(w: ReturnType<typeof mountFull>) {
  await w.find("button.open-btn").trigger("click");
  await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="dialog"]').forEach((n) => n.remove());
});

describe("Dialog", () => {
  it("#trigger 打开：asChild 语义合并到插槽元素，面板进入 open 态", async () => {
    const w = mountFull();
    // Ark 预挂载内容面板：关闭态为 hidden + data-state=closed
    expect(content()!.dataset.state).toBe("closed");
    expect(content()!.hasAttribute("hidden")).toBe(true);

    // asChild 合并：行为直接落在插槽的 <button> 上，全树仅此一个触发元素
    const btn = w.find("button.open-btn");
    expect(btn.attributes("data-part")).toBe("trigger");
    expect(btn.attributes("aria-controls")).toBeDefined();
    expect(document.body.querySelectorAll('[data-part="trigger"]').length).toBe(1);

    await openDialog(w);
    expect(content()!.hasAttribute("hidden")).toBe(false);
    expect(backdrop()).not.toBeNull();
    w.unmount();
  });

  it("title/description props 渲染文案，#title/#description 插槽可覆盖", async () => {
    const w = mountFull();
    await openDialog(w);
    expect(title()!.textContent).toContain("编辑资料");
    expect(description()!.textContent).toContain("保存后立即生效");
    expect(title()!.className).toContain("font-semibold");
    expect(description()!.className).toContain("text-muted-foreground");
    w.unmount();

    const w2 = mountDialog(
      { title: "属性标题", description: "属性描述" },
      {
        trigger: () => h("button", { type: "button" }, "打开"),
        title: () => "插槽标题",
        description: () => "插槽描述",
      },
    );
    await w2.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    expect(title()!.textContent).toContain("插槽标题");
    expect(description()!.textContent).toContain("插槽描述");
    w2.unmount();
  });

  it("默认插槽渲染弹层 body 内容区", async () => {
    const w = mountFull();
    await openDialog(w);
    expect(content()!.querySelector(".body-text")!.textContent).toBe("内容区");
    w.unmount();
  });

  it("#footer 作用域 close 关闭对话框", async () => {
    const w = mountFull();
    await openDialog(w);

    await w.find("button.cancel-btn").trigger("click");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("v-model:open 受控：Trigger 回写 true，Escape/程序化置 false 双向同步", async () => {
    const open = ref(false);
    // 注意：props 对象需在渲染函数内联求值（open: open.value），保证 Host 依赖追踪并随状态重渲染
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Dialog,
            { open: open.value, "onUpdate:open": (v: boolean) => (open.value = v) },
            {
              trigger: () => h("button", { type: "button" }, "打开"),
              default: () => h("p", "受控"),
              title: () => "受控",
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });
    const btn = () => w.find("button[data-part='trigger']");

    await btn().trigger("click");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => expect(open.value).toBe(false));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });

    // 程序化打开：外部改 open 即可驱动面板
    open.value = true;
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    w.unmount();
  });

  it("无 title/description 时不渲染对应 DOM", async () => {
    const w = mountDialog(
      {},
      {
        trigger: () => h("button", { type: "button" }, "打开"),
        default: () => h("p", "纯内容"),
      },
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(content()!.dataset.state).toBe("open"));
    expect(title()).toBeNull();
    expect(description()).toBeNull();
    w.unmount();
  });

  it("aria 接线：content 的 aria-labelledby/describedby 指向 title/description", async () => {
    const w = mountFull();
    await openDialog(w);
    expect(content()!.getAttribute("aria-labelledby")).toBe(title()!.id);
    expect(content()!.getAttribute("aria-describedby")).toBe(description()!.id);
    w.unmount();
  });
});
