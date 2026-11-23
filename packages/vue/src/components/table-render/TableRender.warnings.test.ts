import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineForm } from "../form-render";
import type { FormRenderItem } from "../form-render/types";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import type { TableColumnNode, TableRenderDefinition } from "./types";
import type { VueWrapper } from "@vue/test-utils";

// Phase 0 characterization：逐条锁定 TableRender 当前 DEV 警告文案与次数。
// 期望值抄自 TableRender.vue（157/160/165/202/225/533/545/550/555/560/564/576/805/827）
// 与 useTableRender.ts:567（可见列钳制）。锁定现状，不评价文案良莠。

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
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄" },
  ];
}

interface Query {
  name: string;
}

function searchItems(): FormRenderItem<Query>[] {
  return [{ key: "name", title: "姓名", default: "" }];
}

/** 拆分式直接挂 TableRender（columns/data 走 props） */
function mountSplit(props: Record<string, unknown> = {}) {
  return mount(TableRender, {
    props: { rowKey: "id", columns: baseColumns(), data: USERS.slice(0, 3), ...props },
    attachTo: document.body,
  });
}

/** 聚合式：Host 在 setup 内 defineTable（TanStack 约束）并渲染 TableRender */
function mountDefinition(
  config: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({
        columns: baseColumns(),
        data: USERS.slice(0, 3),
        ...config,
      } as never);
      return () => h(TableRender, { rowKey: "id", definition: box.def, ...props } as never);
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 聚合式 search：Host 内 defineForm + defineTable，prop 同传同一 form */
function mountDefinitionWithSearch() {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      const form = defineForm<Query>({ items: searchItems() });
      box.def = defineTable<User>({
        columns: baseColumns(),
        onLoad: () => {},
        search: form,
      } as never);
      return () => h(TableRender, { rowKey: "id", definition: box.def, search: form } as never);
    },
  });
  return mount(Host, { attachTo: document.body });
}

interface WarnScenario {
  /** 用例后缀（含序号，便于定位） */
  name: string;
  /** 触发该警告的挂载动作 */
  run: () => VueWrapper;
  /** 原文片段（stringContaining） */
  fragment: string;
  /** 额外语义断言（可选） */
  assertExtra?: (wrapper: VueWrapper) => void;
}

const SCENARIOS: WarnScenario[] = [
  {
    name: "01 definition 与 columns 同时传入",
    run: () => mountDefinition({}, { columns: baseColumns() }),
    fragment: "definition 与 columns 同时传入，已按 definition 渲染",
  },
  {
    name: "02 聚合式下 rowSelection",
    run: () => mountDefinition({}, { rowSelection: "checkbox" }),
    fragment: "聚合式下 rowSelection 请在 defineTable 配置，组件 prop 已忽略",
  },
  {
    name: "03 聚合式下 draggable",
    run: () => mountDefinition({}, { draggable: true }),
    fragment: "聚合式下 draggable 请在 defineTable 配置，组件 prop 已忽略",
  },
  {
    name: "04 聚合式下 search",
    run: () => mountDefinitionWithSearch(),
    fragment: "聚合式下 search 已在 defineTable 配置，组件 prop 已忽略",
  },
  {
    name: "05 聚合式下 defaultVisibleKeys",
    run: () =>
      mountDefinition(
        { columnVisibility: { defaultVisibleKeys: ["age"] } },
        {
          defaultVisibleKeys: ["name"],
        },
      ),
    fragment: "聚合式下 defaultVisibleKeys 已在 columnVisibility 配置，组件 prop 已忽略",
    assertExtra: (wrapper) => {
      // definition 优先：仅 age 可见
      expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["年龄"]);
    },
  },
  {
    name: "06 分组节点不应配置 key",
    run: () =>
      mountSplit({
        columns: [
          {
            title: "基本信息",
            key: "g",
            children: [{ key: "name", title: "姓名" }],
          },
        ] as unknown as TableColumnNode<User>[],
      }),
    fragment: "分组节点不应配置 key（分组不是数据列），已忽略",
  },
  {
    name: "07 分组「X」不支持 sortable",
    run: () =>
      mountSplit({
        columns: [
          {
            title: "基本信息",
            sortable: true,
            children: [{ key: "name", title: "姓名", sortable: true }],
          },
        ] as unknown as TableColumnNode<User>[],
      }),
    fragment: "分组「基本信息」不支持 sortable（仅叶子列可排序），已忽略",
  },
  {
    name: "08 分组「X」不支持 fixed",
    run: () =>
      mountSplit({
        columns: [
          {
            title: "基本信息",
            fixed: "left",
            children: [{ key: "name", title: "姓名" }],
          },
        ] as unknown as TableColumnNode<User>[],
      }),
    fragment: "分组「基本信息」不支持 fixed（请配置到叶子列），已忽略",
  },
  {
    name: "09 分组「X」children 为空",
    run: () =>
      mountSplit({
        columns: [{ title: "空分组", children: [] }] as unknown as TableColumnNode<User>[],
      }),
    fragment: "分组「空分组」children 为空，将被忽略",
  },
  {
    name: '10 叶子列 "k" 不应配置 children',
    // 注意：children 为数组时 isColumnGroup=true 走分组分支（564 不可达）；
    // 该文案仅对非数组 children（如 null）生效 —— 现状锁定，非测试笔误。
    run: () =>
      mountSplit({
        columns: [
          { key: "name", title: "姓名", children: null },
        ] as unknown as TableColumnNode<User>[],
      }),
    fragment: '叶子列 "name" 不应配置 children，已按叶子渲染',
  },
  {
    name: '11 fixed 列 "k" 需要数字 width',
    run: () => mountSplit({ columns: [{ key: "name", title: "姓名", fixed: "left" }] }),
    fragment: 'fixed 列 "name" 需要数字 width，已忽略 fixed',
  },
  {
    name: "12 virtual 需要配置 height",
    run: () => mountSplit({ virtual: true }),
    fragment: "virtual 需要配置 height，已降级普通渲染",
  },
  {
    name: "13 N 列均无数字 width",
    run: () =>
      mountSplit({
        columns: Array.from({ length: 10 }, (_, i) => ({ key: `c${i}`, title: `列${i}` })),
        data: USERS.slice(0, 3),
      }),
    fragment: "10 列均无数字 width",
  },
  {
    name: "14 部分记录缺少 rowKey 字段…已禁用行拖拽排序",
    run: () =>
      mountSplit({
        columns: [{ key: "name", title: "姓名" }],
        data: [{ id: 1, name: "甲" }, { name: "乙" }],
        draggable: true,
      }),
    fragment: '部分记录缺少 rowKey 字段 "id"，已禁用行拖拽排序',
  },
];

describe("TableRender DEV 警告（characterization）", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** 断言包含指定原文片段的警告恰好一次 */
  function expectWarnOnce(fragment: string) {
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(fragment));
    const hits = warn.mock.calls.filter((call: unknown[]) => String(call[0]).includes(fragment));
    expect(hits).toHaveLength(1);
  }

  it("DEV 文案逐条锁定：14 条原文行号覆盖齐全", () => {
    expect(SCENARIOS).toHaveLength(14);
    expect(new Set(SCENARIOS.map((s) => s.fragment)).size).toBe(14);
  });

  for (const scenario of SCENARIOS) {
    it(`DEV 文案逐条锁定：${scenario.name}`, async () => {
      const wrapper = scenario.run();
      await flushPromises();
      expectWarnOnce(scenario.fragment);
      scenario.assertExtra?.(wrapper);
      wrapper.unmount();
    });
  }

  it("可见列不能为空钳制警告只发一次", async () => {
    const visibleKeys = ref<string[]>([]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(TableRender, {
            rowKey: "id",
            columns: baseColumns(),
            data: USERS.slice(0, 3),
            visibleKeys: visibleKeys.value,
            "onUpdate:visible-keys": (keys: string[]) => {
              visibleKeys.value = keys;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["姓名"]); // 钳制为首列
    expectWarnOnce("可见列不能为空");

    // 持续传空数组不重复警告（useTableRender.ts:567 的一次性守卫）
    visibleKeys.value = [];
    await flushPromises();
    expectWarnOnce("可见列不能为空");
    wrapper.unmount();
  });
});
