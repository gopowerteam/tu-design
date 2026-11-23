import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h, ref } from "vue";
import { defineTable } from "./define-table";
import TableHeader from "./TableHeader.vue";
import TableRender from "./TableRender.vue";
import type { TableColumnNode, TableRenderDefinition } from "./types";

// Phase 3：TableHeader 抽出 + columnSettingsPlacement + 测量回传。
// happy-dom 无布局（offsetHeight 恒 0），测量用例以原型 getter stub 48 证明真实链路。

const virtualMock = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock("@tanstack/vue-virtual", async () => {
  const { shallowRef, unref } = await import("vue");
  return {
    useVirtualizer: (options: any) => {
      const items = shallowRef<any[]>([]);
      const total = { value: 0 };
      const instance = {
        get options() {
          return unref(options);
        },
        getVirtualItems: () => items.value,
        getTotalSize: () => total.value,
        measureElement: () => {},
      };
      virtualMock.instances.push(instance);
      return shallowRef(instance);
    },
  };
});

interface User {
  id: number;
  name: string;
  age: number;
}

const USERS: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 30 - i,
}));

function baseColumns() {
  return [
    { key: "name", title: "姓名", width: 120 },
    { key: "age", title: "年龄", width: 80, sortable: true },
  ];
}

function groupedColumns(): TableColumnNode<User>[] {
  return [
    {
      title: "基本信息",
      children: [
        { key: "name", title: "姓名", width: 120 },
        { key: "age", title: "年龄", width: 80, sortable: true },
      ],
    },
    { key: "id", title: "ID", width: 60 },
  ];
}

/** 拆分式挂载（columns 走 props；可传 placement/visibleKeys） */
function mountSplit(props: Record<string, unknown> = {}) {
  return mount(TableRender, {
    props: { rowKey: "id", columns: baseColumns(), data: USERS, ...props },
    attachTo: document.body,
  });
}

const popoverContent = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

/** 原型级 offsetHeight stub（happy-dom 无布局；测量链路需真实非 0 值） */
function stubOffsetHeight(value: number) {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  const own = Object.getOwnPropertyDescriptor(proto, "offsetHeight");
  Object.defineProperty(proto, "offsetHeight", { configurable: true, get: () => value });
  return () => {
    if (own) Object.defineProperty(proto, "offsetHeight", own);
    else delete proto.offsetHeight;
  };
}

describe("TableHeader 表头组件", () => {
  it("measure 回传到达 virtualizer options.scrollMargin（stub tr.offsetHeight=48）", async () => {
    const restore = stubOffsetHeight(48);
    try {
      const wrapper = mountSplit({ virtual: true, height: 200 });
      await flushPromises();
      expect(virtualMock.instances.at(-1)!.options.scrollMargin).toBe(48);

      // 列显隐 → 子组件重测 → scrollMargin 保持实测值（父层不清零）
      await wrapper.setProps({ visibleKeys: ["age"] });
      await flushPromises();
      expect(wrapper.findComponent(TableHeader).emitted("measure")!.length).toBeGreaterThan(1);
      expect(virtualMock.instances.at(-1)!.options.scrollMargin).toBe(48);
      wrapper.unmount();
    } finally {
      restore();
    }
  });

  it("表头 ⋮ 打开与工具栏同一面板（列设置面板 DOM 一致）", async () => {
    const wrapper = mountSplit({ columnSettingsPlacement: "header" });
    await flushPromises();
    const trigger = wrapper.find('button[aria-label^="列设置："]');
    expect(trigger.exists()).toBe(true);
    await trigger.trigger("click");
    await vi.waitFor(() => expect(popoverContent()).not.toBeNull());
    expect(popoverContent()!.querySelector("[data-column-settings-panel]")).not.toBeNull();
    expect(popoverContent()!.querySelectorAll("[data-column-item]")).toHaveLength(2);
    wrapper.unmount();
  });

  it("点 ⋮ 不触发排序", async () => {
    const wrapper = mountSplit({ columnSettingsPlacement: "header" });
    await flushPromises();
    const sortableTh = wrapper.find('th[data-column-key="age"]');
    await sortableTh.find('button[aria-label^="列设置："]').trigger("click");
    await flushPromises();
    expect(wrapper.findComponent(TableRender).emitted("sort-change")).toBeUndefined();
    expect(sortableTh.attributes("aria-sort")).toBeUndefined();
    wrapper.unmount();
  });

  it("多级表头只在叶子渲染 ⋮；分组 th 无入口", async () => {
    const wrapper = mountSplit({ columns: groupedColumns(), columnSettingsPlacement: "header" });
    await flushPromises();
    const groupTh = wrapper.find('th[data-column-group="0"]');
    expect(groupTh.exists()).toBe(true);
    expect(groupTh.find('button[aria-label^="列设置："]').exists()).toBe(false);
    expect(wrapper.findAll('button[aria-label^="列设置："]')).toHaveLength(3); // name/age/id
    wrapper.unmount();
  });

  it("placement=auto/toolbar 不渲染表头入口，工具栏入口仍在", async () => {
    for (const placement of ["auto", "toolbar"] as const) {
      const wrapper = mountSplit({ columnSettingsPlacement: placement });
      await flushPromises();
      expect(wrapper.find('button[aria-label^="列设置："]').exists()).toBe(false);
      expect(wrapper.find('button[data-column-settings][aria-label="列设置"]').exists()).toBe(true);
      wrapper.unmount();
    }
  });

  it("data-sort-button 唯一命中且排序正常", async () => {
    const wrapper = mountSplit();
    await flushPromises();
    const buttons = wrapper.findAll("[data-sort-button]");
    expect(buttons).toHaveLength(1);
    await buttons[0]!.trigger("click");
    await flushPromises();
    expect(wrapper.find('th[data-column-key="age"]').attributes("aria-sort")).toBe("ascending");
    wrapper.unmount();
  });

  it("聚合式定义下也能渲染表头（父层 model computed 响应性）", async () => {
    const visibleKeys = ref<string[]>(["name", "age"]);
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({ columns: baseColumns(), data: USERS } as never);
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            columnSettingsPlacement: "header",
            visibleKeys: visibleKeys.value,
            "onUpdate:visible-keys": (keys: string[]) => {
              // 同内容短路：父层 v-model 标准防御（防引擎回写空转）
              if (keys.join("|") !== visibleKeys.value.join("|")) visibleKeys.value = keys;
            },
          } as never);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();
    expect(wrapper.findAll('button[aria-label^="列设置："]')).toHaveLength(2);
    visibleKeys.value = ["age"];
    await flushPromises();
    expect(wrapper.findAll('button[aria-label^="列设置："]')).toHaveLength(1);
    wrapper.unmount();
  });
});
