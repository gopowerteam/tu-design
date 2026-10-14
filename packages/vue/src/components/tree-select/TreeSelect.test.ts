import { mount } from "@vue/test-utils";
import { defineComponent, h, onMounted, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import type { TreeOption } from "../tree-shared";
import { TreeSelect } from "./index";

const TREE: TreeOption[] = [
  {
    key: "a",
    label: "根",
    children: [
      { key: "b", label: "子一" },
      {
        key: "c",
        label: "子二",
        children: [
          { key: "d", label: "孙一" },
          { key: "e", label: "孙二" },
        ],
      },
    ],
  },
];

const trigger = () => document.querySelector<HTMLElement>('[data-part="trigger"]');
const content = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');
const nodes = () => [...document.querySelectorAll<HTMLElement>('[data-part="tree-node"]')];
const nodeOf = (key: string) =>
  document.querySelector<HTMLElement>(`[data-part="tree-node"][data-key="${key}"]`);

function mountTreeSelect(props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(TreeSelect, { options: TREE, ...props, ...attrs });
    },
  });
  return mount(Host, { attachTo: document.body });
}

async function openPanel(w: { find: (s: string) => { trigger: (e: string) => Promise<void> } }) {
  await w.find('[data-part="trigger"]').trigger("click");
  await vi.waitFor(() => expect(content()?.dataset.state).toBe("open"));
}

afterEach(() => {
  // zag popover 会 Teleport 到 body，整体清理避免用例间串扰
  document.body.innerHTML = "";
});

describe("TreeSelect", () => {
  it("点击触发器打开面板，展开后点击子节点回显并关闭", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({ "onUpdate:modelValue": onUpdate });
    await openPanel(w);
    expect(nodes().length).toBe(1); // 默认折叠：仅根可见

    nodeOf("a")!.querySelector<HTMLElement>('[data-part="expand"]')!.click();
    await vi.waitFor(() => expect(nodes().length).toBe(3));

    nodeOf("b")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("b"));
    await vi.waitFor(() => {
      const el = content();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("子一"));
    w.unmount();
  });

  it("multiple 下点击多个节点 tags 依次展示", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      multiple: true,
      defaultExpandAll: true,
      "onUpdate:modelValue": onUpdate,
    });
    await openPanel(w);
    expect(nodes().length).toBe(5);

    nodeOf("b")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith(["b"]));
    nodeOf("d")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith(["b", "d"]));
    w.unmount();
  });

  it("maxTagCount 折叠超出项", async () => {
    const w = mountTreeSelect({
      multiple: true,
      defaultExpandAll: true,
      modelValue: ["a", "b", "d"],
      maxTagCount: 2,
    });
    await vi.waitFor(() => {
      expect(document.querySelectorAll('[data-part="tag"]').length).toBe(2);
      expect(document.querySelector('[data-part="tag-overflow"]')?.textContent).toBe("+1");
    });
    w.unmount();
  });

  it("modelValue 为 undefined 或 [] 均视为无选中", async () => {
    const w1 = mountTreeSelect({ multiple: true, modelValue: undefined, placeholder: "请选择" });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("请选择"));
    expect(document.querySelectorAll('[data-part="tag"]').length).toBe(0);
    w1.unmount();

    const w2 = mountTreeSelect({ multiple: true, modelValue: [], placeholder: "请选择" });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("请选择"));
    expect(document.querySelectorAll('[data-part="tag"]').length).toBe(0);
    w2.unmount();
  });

  it("options 变更后残留失效 key 被静默忽略", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const Host = defineComponent({
      setup() {
        const opts = ref<TreeOption[]>(TREE);
        const mv = ref(["b", "zzz"]);
        onMounted(() => {
          opts.value = [{ key: "a", label: "新根" }];
        });
        return () =>
          h(TreeSelect, {
            options: opts.value,
            modelValue: mv.value,
            multiple: true,
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await vi.waitFor(() => expect(document.querySelectorAll('[data-part="tag"]').length).toBe(0));
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    w.unmount();
  });

  it("clearable 单选点击清空发出 undefined", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      modelValue: "b",
      clearable: true,
      "onUpdate:modelValue": onUpdate,
    });
    await vi.waitFor(() => expect(trigger()!.textContent).toContain("子一"));
    await w.find('[data-part="clear"]').trigger("click");
    expect(onUpdate).toHaveBeenCalledWith(undefined);
    w.unmount();
  });

  it("clearable multiple 点击清空发出 []", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      multiple: true,
      modelValue: ["a", "b"],
      clearable: true,
      "onUpdate:modelValue": onUpdate,
    });
    await w.find('[data-part="clear"]').trigger("click");
    expect(onUpdate).toHaveBeenCalledWith([]);
    w.unmount();
  });

  it("宿主传入的 id 落在触发器元素上", async () => {
    const w = mountTreeSelect({}, { id: "ts" });
    await vi.waitFor(() => expect(trigger()!.id).toBe("ts"));
    w.unmount();
  });
});
