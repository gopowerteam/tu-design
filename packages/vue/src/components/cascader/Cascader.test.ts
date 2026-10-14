import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { TreeOption } from "../tree-shared";
import { Cascader } from "./index";

// 三层树：浙江 → 杭州 → 西湖
const TREE: TreeOption[] = [
  {
    key: "a",
    label: "浙江",
    children: [
      {
        key: "b",
        label: "杭州",
        children: [{ key: "c", label: "西湖" }],
      },
    ],
  },
];

const trigger = () => document.querySelector<HTMLElement>('[data-part="trigger"]');
const contentEl = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');
const columns = () => [...document.querySelectorAll<HTMLElement>('[data-part="column"]')];
const rows = () => [...document.querySelectorAll<HTMLElement>('[data-part="tree-node"]')];
const rowOf = (key: string) =>
  document.querySelector<HTMLElement>(`[data-part="tree-node"][data-key="${key}"]`);

const mounted: Array<{ unmount: () => void }> = [];

afterEach(() => {
  while (mounted.length) mounted.pop()?.unmount();
  document.body
    .querySelectorAll('[data-scope="popover"], [data-scope="cascader"]')
    .forEach((n) => n.remove());
});

interface HostOptions {
  props?: Record<string, unknown>;
  attrs?: Record<string, unknown>;
}

function mountCascader(options: HostOptions = {}) {
  const { props = {}, attrs = {} } = options;
  const Host = defineComponent({
    setup() {
      return () => h(Cascader, { options: TREE, ...attrs, ...props });
    },
  });
  const w = mount(Host, { attachTo: document.body });
  mounted.push(w);
  return w;
}

async function openPanel(w: ReturnType<typeof mountCascader>) {
  await w.find('[data-part="trigger"]').trigger("click");
  await vi.waitFor(() => expect(contentEl()?.dataset.state).toBe("open"));
}

describe("Cascader", () => {
  it("单选点击叶子回显路径并关闭", async () => {
    const onUpdate = vi.fn();
    const w = mountCascader({ props: { "onUpdate:modelValue": onUpdate } });
    await openPanel(w);
    expect(rows().length).toBe(1);
    rowOf("a")!.click();
    await vi.waitFor(() => expect(rows().length).toBe(2));
    rowOf("b")!.click();
    await vi.waitFor(() => expect(rows().length).toBe(3));
    rowOf("c")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("c"));
    await vi.waitFor(() => {
      const el = contentEl();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("浙江 / 杭州 / 西湖"));
    w.unmount();
  });

  it("点击父级仅展开不选中", async () => {
    const onUpdate = vi.fn();
    const w = mountCascader({ props: { "onUpdate:modelValue": onUpdate } });
    await openPanel(w);
    rowOf("a")!.click();
    await vi.waitFor(() => expect(rows().length).toBe(2));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(contentEl()?.dataset.state).toBe("open");
    w.unmount();
  });

  it("expandTrigger=hover 悬停展开下级", async () => {
    const w = mountCascader({ props: { expandTrigger: "hover" } });
    await openPanel(w);
    rowOf("a")!.dispatchEvent(new Event("pointerenter"));
    await vi.waitFor(() => expect(rows().length).toBe(2));
    w.unmount();
  });

  it("multiple+checkable 级联勾选", async () => {
    const onUpdate = vi.fn();
    const w = mountCascader({
      props: { checkable: true, cascade: true, "onUpdate:modelValue": onUpdate },
    });
    await openPanel(w);
    rowOf("a")!.querySelector<HTMLElement>('[data-part="checkbox"]')!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(["a", "b", "c"]));
    w.unmount();
  });

  it("受控回显与标签", async () => {
    const value = ref<string[]>([]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Cascader, {
            options: TREE,
            multiple: true,
            checkable: true,
            cascade: true,
            modelValue: value.value,
            "onUpdate:modelValue": (v: string[]) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await openPanel(w);
    rowOf("a")!.querySelector<HTMLElement>('[data-part="checkbox"]')!.click();
    await vi.waitFor(() => expect(value.value).toEqual(["a", "b", "c"]));
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("浙江 / 杭州 / 西湖"));
    w.unmount();
  });

  it("键盘 ArrowRight 进入下级列，ArrowLeft 返回", async () => {
    const w = mountCascader({});
    await openPanel(w);
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowRight" });
    await vi.waitFor(() => expect(rows().length).toBe(2));
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowLeft" });
    await vi.waitFor(() => expect(rows().length).toBe(1));
    w.unmount();
  });

  it("Escape 关闭面板", async () => {
    const w = mountCascader({});
    await openPanel(w);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await vi.waitFor(() => {
      const el = contentEl();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    w.unmount();
  });

  it("宿主传入的 id 落在触发器元素上", () => {
    const w = mountCascader({ attrs: { id: "cs" } });
    expect(trigger()!.id).toBe("cs");
    w.unmount();
  });
});
