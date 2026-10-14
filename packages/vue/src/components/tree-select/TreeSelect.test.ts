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

describe("TreeSelect checkable", () => {
  it("checkable 点击勾选级联父子（cascade=true 时父勾子全勾）", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      checkable: true,
      cascade: true,
      defaultExpandAll: true,
      "onUpdate:modelValue": onUpdate,
    });
    await openPanel(w);
    nodeOf("c")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith(["c", "d", "e"]));
    await vi.waitFor(() => {
      expect(nodeOf("c")!.hasAttribute("data-checked")).toBe(true);
      expect(nodeOf("d")!.hasAttribute("data-checked")).toBe(true);
      expect(nodeOf("e")!.hasAttribute("data-checked")).toBe(true);
    });
    w.unmount();
  });

  it("checkStrategy=child 时值仅含叶子", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      checkable: true,
      cascade: true,
      checkStrategy: "child",
      defaultExpandAll: true,
      "onUpdate:modelValue": onUpdate,
    });
    await openPanel(w);
    nodeOf("c")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith(["d", "e"]));
    w.unmount();
  });

  it("部分勾选父级显示半选 data-indeterminate", async () => {
    const w = mountTreeSelect({
      checkable: true,
      cascade: true,
      defaultExpandAll: true,
      modelValue: ["d"],
    });
    await openPanel(w);
    await vi.waitFor(() => {
      expect(nodeOf("a")!.hasAttribute("data-indeterminate")).toBe(true);
      expect(nodeOf("c")!.hasAttribute("data-indeterminate")).toBe(true);
      expect(nodeOf("d")!.hasAttribute("data-checked")).toBe(true);
    });
    w.unmount();
  });

  it("再次点击取消勾选", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({
      checkable: true,
      cascade: true,
      defaultExpandAll: true,
      "onUpdate:modelValue": onUpdate,
    });
    await openPanel(w);
    nodeOf("c")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith(["c", "d", "e"]));
    nodeOf("c")!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenLastCalledWith([]));
    w.unmount();
  });

  it("checkStrategy 运行时切换后值集合按新 strategy 归一", async () => {
    const onUpdate = vi.fn();
    const Host = defineComponent({
      setup() {
        const strategy = ref<"all" | "child">("all");
        onMounted(() => {
          strategy.value = "child";
        });
        return () =>
          h(TreeSelect, {
            options: TREE,
            checkable: true,
            cascade: true,
            defaultExpandAll: true,
            checkStrategy: strategy.value,
            modelValue: ["c", "d", "e"],
            "onUpdate:modelValue": onUpdate,
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(["d", "e"]));
    w.unmount();
  });

  it("checkable 下传入单值 Key 按无选中处理且 dev 警告", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const w = mountTreeSelect({
      checkable: true,
      modelValue: "b" as unknown as string[],
      defaultExpandAll: true,
    });
    await openPanel(w);
    expect(nodeOf("b")!.hasAttribute("data-checked")).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
    w.unmount();
  });
});

describe("TreeSelect 键盘与过滤", () => {
  it("ArrowDown 移动 data-active 到下一可见节点", async () => {
    const w = mountTreeSelect({ defaultExpandAll: true });
    await openPanel(w);
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(nodeOf("a")!.hasAttribute("data-active")).toBe(true));
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(nodeOf("b")!.hasAttribute("data-active")).toBe(true));
    w.unmount();
  });

  it("Enter 选中 active 节点", async () => {
    const onUpdate = vi.fn();
    const w = mountTreeSelect({ defaultExpandAll: true, "onUpdate:modelValue": onUpdate });
    await openPanel(w);
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "Enter" });
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("b"));
    w.unmount();
  });

  it("ArrowRight 展开节点，ArrowLeft 折叠回父级", async () => {
    const w = mountTreeSelect({});
    await openPanel(w);
    expect(nodes().length).toBe(1);
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowDown" });
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowRight" });
    await vi.waitFor(() => expect(nodes().length).toBe(3));
    await w.find('[data-part="trigger"]').trigger("keydown", { key: "ArrowLeft" });
    await vi.waitFor(() => expect(nodes().length).toBe(1));
    w.unmount();
  });

  it("filterable 输入「子一」后面板只剩匹配节点及其祖先路径", async () => {
    const w = mountTreeSelect({ filterable: true, defaultExpandAll: true });
    await openPanel(w);
    await w.find("input").setValue("子一");
    await vi.waitFor(() => {
      expect(nodes().map((n) => n.dataset.key)).toEqual(["a", "b"]);
    });
    w.unmount();
  });
});
