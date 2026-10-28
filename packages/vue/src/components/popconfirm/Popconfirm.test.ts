import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Popconfirm } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

/** 面板内按钮按文案查找（面板经 Ark Positioner 挂到 body，需从 document 查询） */
function findButton(text: string) {
  return [...document.querySelectorAll("button")].find((b) => b.textContent?.includes(text));
}

/** 可手动落定的 Promise，用于驱动异步确认的 pending/resolve/reject 时序 */
function deferred() {
  let resolve!: () => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// 渲染函数用法：默认插槽为触发元素；面板内容由组件内置，无需外部提供。
// 宿主内置 v-model:open 桥（open prop + update:open 同步），返回 open ref 供断言受控同步。
function mountPopconfirm(props: Record<string, unknown> = {}) {
  const open = ref(Boolean(props.open));
  const Host = defineComponent({
    setup() {
      return () =>
        h(
          Popconfirm,
          {
            title: "删除确认",
            ...props,
            open: open.value,
            "onUpdate:open": (v: boolean) => {
              open.value = v;
              (props["onUpdate:open"] as ((v: boolean) => void) | undefined)?.(v);
            },
          },
          { default: () => [h("button", { type: "button" }, "删除")] },
        );
    },
  });
  const w = mount(Host, { attachTo: document.body });
  return { w, open };
}

afterEach(() => {
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
});

describe("Popconfirm", () => {
  it("默认插槽即触发元素本体，点击开合并派发 update:open", async () => {
    const onUpdate = vi.fn();
    const { w, open } = mountPopconfirm({ "onUpdate:open": onUpdate });
    const btn = w.find("button[data-part='trigger']");

    // asChild 语义合并：data-part="trigger" 直接落在触发 <button> 上
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe("删除");

    await btn.trigger("click");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(open.value).toBe(true);
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(content()!.textContent).toContain("删除确认");

    await btn.trigger("click");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    expect(open.value).toBe(false);
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("v-model:open 受控：确认后经 update:open 同步回宿主", async () => {
    const { w, open } = mountPopconfirm({ open: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    const confirm = findButton("确定")!;
    expect(confirm).toBeTruthy();
    confirm.click();
    await vi.waitFor(() => expect(open.value).toBe(false));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("closed"));
    w.unmount();
  });

  it("确认：派发 confirm（不重复）并自动关闭", async () => {
    const onConfirm = vi.fn();
    const onUpdate = vi.fn();
    const { w } = mountPopconfirm({ open: true, onConfirm, "onUpdate:open": onUpdate });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    findButton("确定")!.click();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("closed"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("取消：派发 cancel 并自动关闭", async () => {
    const onCancel = vi.fn();
    const onUpdate = vi.fn();
    const { w } = mountPopconfirm({ open: true, onCancel, "onUpdate:open": onUpdate });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    findButton("取消")!.click();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("closed"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("variant=destructive 时确认按钮为危险色，默认为主色", async () => {
    const wDefault = mountPopconfirm({ open: true });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(findButton("确定")!.className).toContain("bg-primary");
    wDefault.w.unmount();

    const wDestructive = mountPopconfirm({ open: true, variant: "destructive" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(findButton("确定")!.className).toContain("bg-destructive");
    expect(findButton("确定")!.className).not.toContain("bg-primary");
    wDestructive.w.unmount();
  });

  it("Promise pending：确认钮 loading 并锁定关闭，resolve 后自动关闭", async () => {
    const d = deferred();
    const onConfirm = vi.fn(() => d.promise);
    const onUpdate = vi.fn();
    const { w } = mountPopconfirm({ open: true, onConfirm, "onUpdate:open": onUpdate });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    findButton("确定")!.click();
    await vi.waitFor(() => expect(findButton("确定")!.disabled).toBe(true));
    // 确认钮转 loading（旋转指示器 + 双钮禁用）
    expect(document.querySelector('[data-scope="popover"] svg.animate-spin')).toBeTruthy();
    expect(findButton("取消")!.disabled).toBe(true);
    expect(onConfirm).toHaveBeenCalledTimes(1);

    // pending 期间取消被锁定，气泡保持展开
    findButton("取消")!.click();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(onUpdate).not.toHaveBeenCalledWith(false);

    // resolve 后解锁并自动关闭
    d.resolve();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("closed"));
    expect(findButton("确定")!.disabled).toBe(false);
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("Promise reject：保持打开并恢复可交互，重试可正常关闭", async () => {
    const d = deferred();
    let calls = 0;
    const onUpdate = vi.fn();
    const { w } = mountPopconfirm({
      open: true,
      onConfirm: () => (calls++ === 0 ? d.promise : Promise.resolve()),
      "onUpdate:open": onUpdate,
    });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    findButton("确定")!.click();
    await vi.waitFor(() => expect(findButton("确定")!.disabled).toBe(true));

    d.reject(new Error("failed"));
    await vi.waitFor(() => expect(findButton("确定")!.disabled).toBe(false));
    // reject 后气泡保持打开，未派发关闭
    expect(content()?.dataset.state).toBe("open");
    expect(onUpdate).not.toHaveBeenCalledWith(false);

    // 恢复后重试确认可正常关闭
    findButton("确定")!.click();
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("closed"));
    w.unmount();
  });

  it("无障碍：Title/Description 接线 aria-labelledby / aria-describedby", async () => {
    const { w } = mountPopconfirm({ open: true, description: "删除后数据不可恢复" });
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    const c = content()!;
    const labelledby = c.getAttribute("aria-labelledby");
    const describedby = c.getAttribute("aria-describedby");
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();
    expect(document.getElementById(labelledby!)?.textContent).toContain("删除确认");
    expect(document.getElementById(describedby!)?.textContent).toContain("删除后数据不可恢复");
    w.unmount();
  });
});
