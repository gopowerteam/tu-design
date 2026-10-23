import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import type { TableColumnOptions, TableRenderDefinition } from "./types";

interface User {
  id: number;
  name: string;
  age: number;
}
const USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 25 - i,
}));

interface Dept extends User {
  children?: Dept[];
}
const TREE: Dept[] = [
  {
    id: 1,
    name: "总部",
    age: 40,
    children: [
      { id: 11, name: "研发部", age: 30 },
      { id: 12, name: "市场部", age: 28 },
    ],
  },
  { id: 2, name: "分公司", age: 35 },
];

function baseColumns(): TableColumnOptions<User>[] {
  return [
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄", sortable: true, formatter: (r) => `${r.age}岁` },
  ];
}

function makeTableRender(config: Record<string, unknown> = {}) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({ columns: baseColumns(), data: USERS, ...config } as never);
      return () => h(TableRender, { rowKey: "id", definition: box.def } as never);
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def! };
}

function makeServerRender(onLoad: (params: any) => unknown, config: Record<string, unknown> = {}) {
  return makeTableRender({ onLoad, data: undefined, ...config });
}

function cellStyle(el: { element: Element }): CSSStyleDeclaration {
  return (el.element as HTMLElement).style;
}

describe("TableRender 列显隐（column visibility）", () => {
  const popoverContent = () =>
    document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

  afterEach(() => {
    document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
  });

  async function openColumnSettings(wrapper: ReturnType<typeof mount>) {
    await wrapper.find('button[aria-label="列设置"]').trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));
  }
  /** 点击面板某列的清单项（div 整行可点） */
  async function clickColumnItem(key: string) {
    const item = popoverContent()?.querySelector<HTMLElement>(`[data-column-key="${key}"]`);
    if (!item) throw new Error(`面板中不存在列 ${key}`);
    item.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
  }

  function panelControl(key: string) {
    const item = popoverContent()?.querySelector<HTMLElement>(`[data-column-key="${key}"]`);
    return item?.querySelector<HTMLElement>("[data-part='control']");
  }

  function headerTexts(wrapper: ReturnType<typeof mount>) {
    return wrapper.findAll("thead th").map((th) => th.text());
  }

  it("非受控：面板点击隐藏/恢复列，column-visibility-change 载荷为 columns 原序可见 key", async () => {
    const { wrapper } = makeTableRender({ data: USERS.slice(0, 3) });
    await openColumnSettings(wrapper);
    expect(headerTexts(wrapper)).toEqual(["姓名", "年龄"]);

    // 隐藏「姓名」
    await clickColumnItem("name");
    await flushPromises();
    expect(headerTexts(wrapper)).toEqual(["年龄"]);

    // 恢复
    await clickColumnItem("name");
    await flushPromises();
    expect(headerTexts(wrapper)).toEqual(["姓名", "年龄"]);

    // 事件载荷（columns 原序）
    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("column-visibility-change")?.map((e) => e[0])).toEqual([
      ["age"],
      ["name", "age"],
    ]);
    expect(table.emitted("update:visible-keys")?.map((e) => e[0])).toEqual([
      ["age"],
      ["name", "age"],
    ]);
    wrapper.unmount();
  });

  it("受控：prop 驱动列集，内部显隐回写闭环", async () => {
    const visibleKeys = ref<string[]>(["age"]);
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({
          columns: baseColumns(),
          data: USERS.slice(0, 3),
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            visibleKeys: visibleKeys.value,
            "onUpdate:visible-keys": (keys: string[]) => {
              // 同内容短路：父层 v-model 的标准防御（引擎已有等值守卫，此处防测试包装层空转）
              if (keys.join("|") !== visibleKeys.value.join("|")) visibleKeys.value = keys;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();
    expect(headerTexts(wrapper)).toEqual(["年龄"]);

    // 外部变更（Host 重渲染 → 子 props 更新）
    visibleKeys.value = ["name", "age"];
    await flushPromises();
    expect(headerTexts(wrapper)).toEqual(["姓名", "年龄"]);

    // 内部显隐（面板）→ 回写闭环
    await openColumnSettings(wrapper);
    await clickColumnItem("name");
    await flushPromises();
    expect(visibleKeys.value).toEqual(["age"]);
    wrapper.unmount();
  });

  it("defaultVisibleKeys：拆分式 prop 与聚合式 columnVisibility 等效；R21 重置恢复基准", async () => {
    // 拆分式
    const split = makeTableRender({
      data: USERS.slice(0, 3),
      defaultVisibleKeys: ["age"],
    });
    expect(headerTexts(split.wrapper)).toEqual(["年龄"]);

    await openColumnSettings(split.wrapper);
    await clickColumnItem("name"); // 显示额外列
    await flushPromises();
    expect(headerTexts(split.wrapper)).toEqual(["姓名", "年龄"]);
    // R21：重置回 defaultVisibleKeys
    const buttons = Array.from(popoverContent()!.querySelectorAll("button"));
    const resetBtn = buttons.find((b) => b.textContent?.trim() === "重置")!;
    resetBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    expect(headerTexts(split.wrapper)).toEqual(["年龄"]);
    split.wrapper.unmount();

    // 聚合式 columnVisibility 等效
    const { wrapper } = makeTableRender({
      data: USERS.slice(0, 3),
      columnVisibility: { defaultVisibleKeys: ["age"] },
    });
    expect(headerTexts(wrapper)).toEqual(["年龄"]);
    wrapper.unmount();
  });

  it("R26：聚合式与拆分式 defaultVisibleKeys 同传 → DEV 警告，definition 优先", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({
          columns: baseColumns(),
          data: USERS.slice(0, 3),
          columnVisibility: { defaultVisibleKeys: ["age"] },
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            defaultVisibleKeys: ["name"], // 拆分式 prop 同传（手滑场景）
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("defaultVisibleKeys"));
    expect(headerTexts(wrapper)).toEqual(["年龄"]); // definition 优先
    expect(box.def!.defaultVisibleKeys).toEqual(["age"]);
    wrapper.unmount();
  });

  it("fixed 偏移基于可见集重算；fixed-left 全组隐藏无残留（R23）", async () => {
    const visibleKeys = ref<string[]>(["name", "age", "id"]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(TableRender, {
            rowKey: "id",
            columns: [
              { key: "name", title: "姓名", width: 120, fixed: "left" },
              { key: "age", title: "年龄", width: 100, fixed: "left" },
              { key: "id", title: "ID", width: 80, fixed: "right" },
            ],
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

    let tds = wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(tds).toHaveLength(3);
    expect(cellStyle(tds[0]).left).toBe("0px");
    expect(cellStyle(tds[1]).left).toBe("120px"); // name 宽 120

    // 隐藏 name → age 偏移重算为 0 且成为左组交界
    visibleKeys.value = ["age", "id"];
    await flushPromises();
    tds = wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(tds).toHaveLength(2);
    expect(cellStyle(tds[0]).left).toBe("0px");
    expect(tds[0].classes()).toContain("border-r");

    // fixed-left 全组隐藏 → 无 sticky 残留（R23）
    visibleKeys.value = ["id"];
    await flushPromises();
    tds = wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(cellStyle(tds[0]).position).toBe("sticky"); // id 仍 right sticky
    expect(cellStyle(tds[0]).right).toBe("0px");
    expect(tds[0].classes()).not.toContain("border-r"); // 左组空：无边框残留
    wrapper.unmount();
  });

  it("fixed-right 全组隐藏无残留；空态 colspan 同步（R23）", async () => {
    const visibleKeys = ref<string[]>(["name", "id"]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(TableRender, {
            rowKey: "id",
            columns: [
              { key: "name", title: "姓名", width: 120 },
              { key: "id", title: "ID", width: 80, fixed: "right" },
            ],
            data: [],
            visibleKeys: visibleKeys.value,
            "onUpdate:visible-keys": (keys: string[]) => {
              visibleKeys.value = keys;
            },
            rowSelection: "checkbox",
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    // 空态 colspan = 可见列 2 + 选择列 1
    expect(wrapper.find("[data-empty] td").attributes("colspan")).toBe("3");

    // 隐藏 id（唯一 fixed-right）→ 无 right sticky 残留
    visibleKeys.value = ["name"];
    await flushPromises();
    expect(wrapper.find("[data-empty] td").attributes("colspan")).toBe("2");
    // 首个 th 是选择列（最左 sticky）；断言最后一个 th（name，非 fixed）
    const lastTh = wrapper.findAll("thead tr th").at(-1)!;
    expect(cellStyle(lastTh).position).not.toBe("sticky");
    expect(lastTh.classes()).not.toContain("border-l");
    wrapper.unmount();
  });

  it("R20 最少一列：唯一可见列 checkbox disabled；全选已全选时 disabled", async () => {
    const { wrapper } = makeTableRender({
      data: USERS.slice(0, 3),
      visibleKeys: ["name"],
    });
    await openColumnSettings(wrapper);

    const nameControl = panelControl("name");
    expect(nameControl?.getAttribute("data-state")).toBe("checked");
    expect(nameControl?.hasAttribute("data-disabled")).toBe(true); // 唯一可见 → 不可隐藏

    // 「全选」：点击后恢复全列可见
    const buttons = Array.from(popoverContent()!.querySelectorAll("button"));
    const selectAllBtn = buttons.find((b) => b.textContent?.trim() === "全选")!;
    selectAllBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    expect(headerTexts(wrapper)).toEqual(["姓名", "年龄"]);
    // 已全选 → disabled
    expect(selectAllBtn.hasAttribute("disabled")).toBe(true);
    wrapper.unmount();
  });

  it("树形 + 选择列共存：面板清单不含选择列；隐藏首列后 caret 顺延至下一可见列（R22）", async () => {
    const { wrapper } = makeTableRender({
      data: TREE,
      pageSize: 100,
      tree: { defaultExpandAll: true },
      rowSelection: "checkbox",
      columns: [
        { key: "name", title: "姓名", width: 120 },
        { key: "age", title: "年龄" },
        { key: "id", title: "ID" },
      ],
    });
    await openColumnSettings(wrapper);

    // 清单 = 业务列原序（不含选择列）
    const keys = Array.from(popoverContent()!.querySelectorAll("[data-column-key]")).map((el) =>
      el.getAttribute("data-column-key"),
    );
    expect(keys).toEqual(["name", "age", "id"]);

    // 隐藏首列（name）→ 树形缩进 + caret 顺延至下一可见列（age）
    await clickColumnItem("name");
    await flushPromises();
    const firstRow = wrapper.findAll("tbody tr")[0]!;
    const tds = firstRow.findAll("td");
    // tds[0] = 选择列；tds[1] = 可见首列（age），承载缩进与 caret
    expect(tds[1].find('button[aria-label="收起"]').exists()).toBe(true);
    expect(tds[1].find("td span[style], span[style]").exists()).toBe(true);
    wrapper.unmount();
  });

  it("R25：列显隐不触发 onLoad、不重置 pageIndex/sort/selectedKeys", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();
    expect(onLoad).toHaveBeenCalledTimes(1);

    def().setPageIndex(2);
    await flushPromises();
    def().toggleSort("age");
    await flushPromises();
    def().setSelection([1]);
    await flushPromises();
    const callsAfterSetup = onLoad.mock.calls.length;

    await openColumnSettings(wrapper);
    await clickColumnItem("name");
    await flushPromises();

    expect(onLoad.mock.calls.length).toBe(callsAfterSetup); // 不触发 onLoad
    // toggleSort 的 R8 归位（与显隐无关）：排序后页码已归 1
    expect(def().page.pageIndex).toBe(1); // 显隐不重置页码
    expect(def().sort.value).toEqual({ key: "age", direction: "asc" });
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));
    wrapper.unmount();
  });

  it("columnSettings: false：不渲染触发器，受控 visibleKeys 仍生效", async () => {
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS.slice(0, 3),
        visibleKeys: ["age"],
        columnSettings: false,
      },
      attachTo: document.body,
    });
    await flushPromises();

    expect(wrapper.find('button[aria-label="列设置"]').exists()).toBe(false);
    expect(headerTexts(wrapper)).toEqual(["年龄"]); // 受控 API 独立于 UI
    wrapper.unmount();
  });

  it("R24：受控空数组钳制为首列可见并 DEV 警告一次", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
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

    expect(headerTexts(wrapper)).toEqual(["姓名"]); // 钳制为首列
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("可见列不能为空"));
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("可见列不能为空"))).toHaveLength(1);

    // 持续传空数组不重复警告
    visibleKeys.value = [];
    await flushPromises();
    expect(warn.mock.calls.filter((c) => String(c[0]).includes("可见列不能为空"))).toHaveLength(1);
    wrapper.unmount();
  });

  it("Esc 关闭面板（open 态 → closed）", async () => {
    const { wrapper } = makeTableRender({ data: USERS.slice(0, 3) });
    await openColumnSettings(wrapper);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await vi.waitFor(() => {
      const el = popoverContent();
      expect(el === null || el.dataset.state === "closed").toBe(true);
    });
    wrapper.unmount();
  });
});
