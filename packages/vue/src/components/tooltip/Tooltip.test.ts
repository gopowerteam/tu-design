import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Tooltip } from "./index";

const content = () =>
  document.querySelector<HTMLElement>('[data-scope="tooltip"][data-part="content"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="tooltip"]').forEach((n) => n.remove());
});

describe("Tooltip", () => {
  it("content 渲染提示文字，pointermove 显示、pointerleave 隐藏", async () => {
    const w = mount(Tooltip, {
      props: { delayDuration: 0, content: "提示文本" },
      slots: { default: () => h("button", "悬停我") },
      attachTo: document.body,
    });

    const trigger = w.find('[data-part="trigger"]');
    expect(trigger.text()).toBe("悬停我");

    await trigger.trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toContain("提示文本");

    await trigger.trigger("pointerleave");
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("默认插槽即触发元素本身：不产生额外包裹元素，行为合并其上", async () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tooltip,
            { delayDuration: 0, content: "前往帮助" },
            { default: () => [h("a", { class: "link", href: "/help" }, "帮助")] },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    // 触发 DOM 就是插槽里的 <a>：href 等原生属性保留，data-part 直接落在同一节点
    const a = w.find("a");
    expect(a.exists()).toBe(true);
    expect(a.attributes("href")).toBe("/help");
    expect(a.attributes("data-part")).toBe("trigger");
    expect(w.find('[data-part="trigger"]').element).toBe(a.element);

    // 行为保持：悬停插槽节点即可打开气泡
    await a.trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    w.unmount();
  });

  it("v-model:open 受控（渲染函数用法）", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tooltip,
            {
              open: open.value,
              "onUpdate:open": (v: boolean) => (open.value = v),
              content: "提示文本",
            },
            { default: () => [h("button", "悬停我")] },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(open.value).toBe(true));
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    await w.find('[data-part="trigger"]').trigger("pointerleave");
    await vi.waitFor(() => expect(open.value).toBe(false));
    w.unmount();
  });

  it("纯受控无触发器：省略默认插槽，open 直接驱动气泡（table-render 列设置场景）", async () => {
    const open = ref(false);
    const Host = defineComponent({
      setup() {
        return () => h(Tooltip, { open: open.value }, { content: () => "列设置" });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    // 无默认插槽 → 不渲染 Trigger
    expect(w.find('[data-part="trigger"]').exists()).toBe(false);

    open.value = true;
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.textContent).toBe("列设置");

    open.value = false;
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("#content 插槽覆盖 content prop（富内容）", async () => {
    const w = mount(Tooltip, {
      props: { delayDuration: 0, content: "纯文本兜底" },
      slots: {
        default: () => h("button", "悬停我"),
        content: () => h("strong", "富内容提示"),
      },
      attachTo: document.body,
    });

    await w.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
    expect(content()!.querySelector("strong")?.textContent).toBe("富内容提示");
    expect(content()!.textContent).not.toContain("纯文本兜底");
    w.unmount();
  });

  it("contentClass 追加样式、contentProps 透传 Content", async () => {
    const onClick = vi.fn();
    const w = mount(Tooltip, {
      props: {
        delayDuration: 0,
        content: "提示文本",
        contentClass: "max-w-40",
        contentProps: { id: "tip-1", "data-testid": "tip", onClick },
      },
      slots: { default: () => h("button", "悬停我") },
      attachTo: document.body,
    });

    await w.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));

    // contentClass 追加（基础变体类保留）
    expect(content()!.className).toContain("bg-primary");
    expect(content()!.className).toContain("max-w-40");
    // contentProps 透传到 Content 元素
    expect(content()!.id).toBe("tip-1");
    expect(content()!.dataset.testid).toBe("tip");

    content()!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(onClick).toHaveBeenCalled());
    w.unmount();
  });
});
