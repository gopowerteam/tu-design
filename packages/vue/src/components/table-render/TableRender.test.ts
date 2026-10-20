import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineColumns } from "./define-columns";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import type { ColumnRenders } from "./column-renders";
import type { TableColumnOptions, TableLoadParams, TableRenderDefinition } from "./types";

interface User {
  id: number;
  name: string;
  /** 构造为递减序列，便于断言排序前后顺序 */
  age: number;
}

const USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 25 - i,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

function baseColumns(): TableColumnOptions<User>[] {
  return [
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄", sortable: true, formatter: (r) => `${r.age}岁` },
  ];
}

/** Host 在 setup 内 defineTable（TanStack 约束）并渲染 TableRender */
function makeTableRender(
  config: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({ columns: baseColumns(), data: USERS, ...config });
      return () => h(TableRender, { rowKey: "id", definition: box.def, ...props });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def! };
}

/** 数据行（排除骨架行与空态行）单元格文本矩阵 */
function dataRows(wrapper: ReturnType<typeof mount>): string[][] {
  return wrapper
    .findAll("tbody tr:not([data-skeleton]):not([data-empty])")
    .map((tr) => tr.findAll("td").map((td) => td.text()));
}

describe("TableRender 基础渲染", () => {
  it("按 columns 顺序渲染表头 title", () => {
    const { wrapper } = makeTableRender();
    expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["姓名", "年龄"]);
  });

  it("formatter 优先于默认值取值", () => {
    const { wrapper } = makeTableRender();
    expect(dataRows(wrapper)[0]).toEqual(["用户1", "25岁"]);
  });

  it("无 formatter 时按 record[key] 取值", () => {
    const { wrapper } = makeTableRender({
      columns: [{ key: "age", title: "年龄" }],
    });
    expect(dataRows(wrapper)[0]).toEqual(["25"]);
  });

  it("render 覆盖 formatter 与默认值，且可交互", async () => {
    const onEdit = vi.fn();
    const { wrapper } = makeTableRender({
      columns: [
        {
          key: "age",
          title: "年龄",
          formatter: (r: User) => `${r.age}岁`,
          render: (rr: ColumnRenders<User>) =>
            rr.render((record: User) => h("button", { onClick: () => onEdit(record) }, "编辑")),
        },
      ],
    });

    const cell = wrapper.find("tbody tr td");
    expect(cell.text()).toBe("编辑");
    await cell.get("button").trigger("click");
    expect(onEdit).toHaveBeenCalledWith(USERS[0]);
  });
});

describe("TableRender 静态模式", () => {
  it("默认 pageSize=10 只渲染首页 10 行", () => {
    const { wrapper, def } = makeTableRender();
    expect(dataRows(wrapper)).toHaveLength(10);
    expect(def().page.pageIndex).toBe(1);
    expect(def().page.pageSize).toBe(10);
  });

  it("setPageIndex 切页渲染对应数据窗口", async () => {
    const { wrapper, def } = makeTableRender();
    def().setPageIndex(2);
    await wrapper.vm.$nextTick();
    expect(dataRows(wrapper)[0]?.[0]).toBe("用户11");
    expect(dataRows(wrapper)).toHaveLength(10);
  });

  it("setPageSize 变更重置 pageIndex 并按新容量渲染", async () => {
    const { wrapper, def } = makeTableRender();
    def().setPageIndex(3);
    await wrapper.vm.$nextTick();
    def().setPageSize(5);
    await wrapper.vm.$nextTick();
    expect(def().page.pageIndex).toBe(1);
    expect(dataRows(wrapper)).toHaveLength(5);
  });

  it("toggleSort 三态：无 → asc → desc → 取消", async () => {
    const { wrapper, def } = makeTableRender();
    expect(def().sort.value).toBeUndefined();

    def().toggleSort("age");
    await wrapper.vm.$nextTick();
    expect(def().sort.value).toEqual({ key: "age", direction: "asc" });
    expect(dataRows(wrapper)[0]?.[0]).toBe("用户25");

    def().toggleSort("age");
    await wrapper.vm.$nextTick();
    expect(def().sort.value).toEqual({ key: "age", direction: "desc" });
    expect(dataRows(wrapper)[0]?.[0]).toBe("用户1");

    def().toggleSort("age");
    await wrapper.vm.$nextTick();
    expect(def().sort.value).toBeUndefined();
  });

  it("非 sortable 列 toggleSort 为空操作", () => {
    const { def } = makeTableRender();
    def().toggleSort("name");
    expect(def().sort.value).toBeUndefined();
  });
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** 服务端模式：只给 onLoad，不给 data */
function makeServerRender(onLoad: (params: any) => unknown, config: Record<string, unknown> = {}) {
  return makeTableRender({ columns: baseColumns(), onLoad, data: undefined, ...config });
}

describe("TableRender 服务端模式", () => {
  it("autoLoad 挂载后触发一次 onLoad，update 回写渲染与 total", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 3), 42));
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(dataRows(wrapper)).toHaveLength(3);
    expect(def().page.total).toBe(42);
  });

  it("onLoad 收到 1-based page、空 form 与 undefined sort", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    makeServerRender(onLoad);
    await flushPromises();

    const params = onLoad.mock.calls[0][0];
    expect(params.page.pageIndex).toBe(1);
    expect(params.page.pageSize).toBe(10);
    expect(params.form).toEqual({});
    expect(params.sort).toBeUndefined();
  });

  it("autoLoad=false 时挂载不触发 onLoad", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    makeServerRender(onLoad, { autoLoad: false });
    await flushPromises();

    expect(onLoad).not.toHaveBeenCalled();
  });

  it("update 不传 total 时保留旧值（R10）", async () => {
    let call = 0;
    const onLoad = vi.fn(({ update }: any) => {
      call += 1;
      return call === 1 ? update(USERS.slice(0, 2), 88) : update(USERS.slice(0, 5));
    });

    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();
    expect(def().page.total).toBe(88);

    def().reload();
    await flushPromises();

    expect(dataRows(wrapper)).toHaveLength(5);
    expect(def().page.total).toBe(88);
  });

  it("翻页以新 pageIndex 重调 onLoad", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 3), 100));
    const { def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad.mock.calls[1][0].page.pageIndex).toBe(2);
  });

  it("排序切换重置 pageIndex=1 并带 sort 重载；取消排序回 undefined（R8）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 3), 100));
    const { def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(3);
    await flushPromises();

    def().toggleSort("age");
    await flushPromises();

    const last = onLoad.mock.calls.at(-1)![0];
    expect(last.page.pageIndex).toBe(1);
    expect(last.sort).toEqual({ key: "age", direction: "asc" });

    def().toggleSort("age");
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].sort).toEqual({ key: "age", direction: "desc" });

    def().toggleSort("age");
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].sort).toBeUndefined();
  });

  it("竞态守卫：旧请求的慢响应不覆盖新请求结果（R6）", async () => {
    const first = deferred();
    const second = deferred();
    const oldRows = [{ id: 91, name: "旧数据", age: 1 }];
    const newRows = [{ id: 92, name: "新数据", age: 2 }];
    let call = 0;

    const onLoad = vi.fn(({ update }: any) => {
      call += 1;
      return call === 1
        ? first.promise.then(() => update(oldRows, 1))
        : second.promise.then(() => update(newRows, 2));
    });

    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();

    second.resolve();
    await flushPromises();
    expect(dataRows(wrapper)[0]?.[0]).toBe("新数据");

    first.resolve();
    await flushPromises();
    expect(dataRows(wrapper)[0]?.[0]).toBe("新数据");
    expect(def().page.total).toBe(2);
  });

  it("onLoad 抛错 → console.error 且保持空态，组件不炸（R5）", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onLoad = vi.fn(async () => {
      throw new Error("boom");
    });

    const { wrapper } = makeServerRender(onLoad);
    await flushPromises();

    expect(error).toHaveBeenCalled();
    expect(dataRows(wrapper)).toHaveLength(0);
  });
});

describe("TableRender 渲染与交互", () => {
  function clickButton(wrapper: ReturnType<typeof mount>, text: string) {
    const target = wrapper.findAll("button").find((button) => button.text() === text);
    if (!target) throw new Error(`未找到按钮：${text}`);
    return target.trigger("click");
  }

  it("拆分式 props 与 definition 渲染等价（D4 双模式）", () => {
    const { wrapper } = makeTableRender();
    const split = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS },
      attachTo: document.body,
    });
    expect(dataRows(split)).toEqual(dataRows(wrapper));
    split.unmount();
  });

  it("排序表头渲染为 button 且带 aria-sort（R16）", async () => {
    const { wrapper, def } = makeTableRender();
    const sortableTh = wrapper.findAll("thead th")[1];
    expect(sortableTh.find("button").exists()).toBe(true);
    expect(sortableTh.attributes("aria-sort")).toBeUndefined();

    await sortableTh.get("button").trigger("click");
    expect(sortableTh.attributes("aria-sort")).toBe("ascending");

    def().toggleSort("age");
    await wrapper.vm.$nextTick();
    expect(sortableTh.attributes("aria-sort")).toBe("descending");

    def().toggleSort("age");
    await wrapper.vm.$nextTick();
    expect(sortableTh.attributes("aria-sort")).toBeUndefined();

    // 不可排序列不出现排序按钮，也永不标注 aria-sort
    const plainTh = wrapper.findAll("thead th")[0];
    expect(plainTh.find("button").exists()).toBe(false);
    expect(plainTh.attributes("aria-sort")).toBeUndefined();
  });

  it("点击排序表头发出 sort-change 并触发重载", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 2), 50));
    const split = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), onLoad },
      attachTo: document.body,
    });
    await flushPromises();

    await split.findAll("thead th")[1].get("button").trigger("click");
    await flushPromises();

    expect(split.emitted("sort-change")?.[0]).toEqual([{ key: "age", direction: "asc" }]);
    expect(onLoad).toHaveBeenCalledTimes(2);
    split.unmount();
  });

  it("分页条点击下一页以新 pageIndex 重调 onLoad（用例 5）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper } = makeServerRender(onLoad);
    await flushPromises();

    await clickButton(wrapper, "下一页");
    await flushPromises();

    expect(onLoad.mock.calls.at(-1)![0].page.pageIndex).toBe(2);
  });

  it("分页条切换每页条数重置页码并重载（D12/R9）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(3);
    await flushPromises();
    await wrapper.find("select").setValue("20");
    await flushPromises();

    const last = onLoad.mock.calls.at(-1)![0];
    expect(last.page.pageSize).toBe(20);
    expect(last.page.pageIndex).toBe(1);
  });

  it("单页时隐藏分页条（R13）", () => {
    const { wrapper } = makeTableRender({ data: USERS.slice(0, 3) });
    expect(wrapper.find("select").exists()).toBe(false);
    expect(wrapper.findAll("button").some((b) => b.text() === "下一页")).toBe(false);
  });

  it("ellipsis 列单元格带 title 属性（R15）", () => {
    const { wrapper } = makeTableRender({
      columns: [{ key: "name", title: "姓名", ellipsis: true }],
    });
    const cell = wrapper.find("tbody tr td");
    expect(cell.attributes("title")).toBe("用户1");
    expect(cell.classes()).toContain("truncate");
  });

  it("内部加载态渲染 5 行骨架（R14）", async () => {
    const pending = deferred();
    const { wrapper } = makeServerRender(() => pending.promise);
    await flushPromises();

    expect(wrapper.findAll("tbody tr[data-skeleton]")).toHaveLength(5);
    pending.resolve();
    await flushPromises();
  });

  it("外部 loading 叠加渲染骨架（R14）", () => {
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: [], loading: true },
      attachTo: document.body,
    });
    expect(wrapper.findAll("tbody tr[data-skeleton]")).toHaveLength(5);
    wrapper.unmount();
  });

  it("空态渲染 emptyText，#empty 插槽优先", () => {
    const empty = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: [] },
      slots: { empty: () => h("p", "空空如也") },
      attachTo: document.body,
    });
    expect(empty.find("[data-empty]").text()).toBe("空空如也");
    empty.unmount();

    const plain = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: [] },
      attachTo: document.body,
    });
    expect(plain.find("[data-empty]").text()).toBe("暂无数据");
    plain.unmount();
  });

  it("点击行发出 row-click(record, index, event)", async () => {
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS },
      attachTo: document.body,
    });

    await wrapper.findAll("tbody tr")[2].trigger("click");

    const args = wrapper.emitted("row-click")![0] as unknown[];
    expect(args[0]).toEqual(USERS[2]);
    expect(args[1]).toBe(2);
    // happy-dom 派发的是 PatchedEvent（非原生 Event 实例），按 type 断言
    expect((args[2] as Event).type).toBe("click");
    wrapper.unmount();
  });

  it("reload(true) 归位首页且只触发一次 onLoad（R12）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(3);
    await flushPromises();
    const before = onLoad.mock.calls.length;

    def().reload(true);
    await flushPromises();

    expect(onLoad.mock.calls.length).toBe(before + 1);
    expect(onLoad.mock.calls.at(-1)![0].page.pageIndex).toBe(1);
  });

  it("静态模式 reload 重同步数据源", async () => {
    const source = ref(USERS.slice(0, 2));
    const { wrapper, def } = makeTableRender({ data: source });
    expect(dataRows(wrapper)).toHaveLength(2);

    source.value = USERS.slice(0, 4);
    def().reload();
    await wrapper.vm.$nextTick();

    expect(dataRows(wrapper)).toHaveLength(4);
    expect(def().page.total).toBe(4);

    // 普通数组是快照：就地变更不会被感知，需显式 reload
    const snapshot = USERS.slice(0, 3);
    const plain = makeTableRender({ data: snapshot });
    expect(dataRows(plain.wrapper)).toHaveLength(3);

    snapshot.push(...USERS.slice(3, 6));
    expect(dataRows(plain.wrapper)).toHaveLength(3);

    plain.def().reload();
    await plain.wrapper.vm.$nextTick();
    expect(dataRows(plain.wrapper)).toHaveLength(6);
  });

  it("defaultSort 决定初始排序方向（静态模式）", () => {
    const { wrapper } = makeTableRender({
      columns: [{ key: "age", title: "年龄", sortable: true, defaultSort: "asc" }],
    });
    expect(dataRows(wrapper)[0]?.[0]).toBe("1");

    const desc = makeTableRender({
      columns: [{ key: "age", title: "年龄", sortable: true, defaultSort: "desc" }],
    });
    expect(dataRows(desc.wrapper)[0]?.[0]).toBe("25");
  });

  it("defaultSort 参与服务端首载 sort 参数", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    makeServerRender(onLoad, {
      columns: [{ key: "age", title: "年龄", sortable: true, defaultSort: "desc" }],
    });
    await flushPromises();

    expect(onLoad.mock.calls[0][0].sort).toEqual({ key: "age", direction: "desc" });
  });
});

describe("TableRender 兜底与 DEV 警告", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("columns 为空：DEV 警告且渲染空表不抛错（R1）", () => {
    const { wrapper } = makeTableRender({ columns: [] });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("columns"));
    expect(wrapper.find("table").exists()).toBe(true);
    expect(wrapper.findAll("thead th")).toHaveLength(0);
  });

  it("data 非数组：回退空表 + DEV 警告（R2）", () => {
    const { wrapper } = makeTableRender({ data: "not-array" });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("data"));
    expect(wrapper.find("[data-empty]").exists()).toBe(true);
  });

  it("definition 与 columns 并传：definition 优先 + DEV 警告（R4）", () => {
    const { wrapper, def } = makeTableRender();
    const both = mount(TableRender, {
      props: { rowKey: "id", definition: def(), columns: [{ key: "id", title: "ID" }] },
      attachTo: document.body,
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("definition"));
    expect(both.findAll("thead th")).toHaveLength(2);
    expect(dataRows(both)).toEqual(dataRows(wrapper));
    both.unmount();
  });

  it("onLoad 与 data 并传：onLoad 优先 + DEV 警告（R4）", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    const { wrapper } = makeServerRender(onLoad, { data: USERS });
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("onLoad"));
    // 以 onLoad 回写的数据为准，data 被忽略
    expect(wrapper.find("[data-empty]").exists()).toBe(true);
    expect(onLoad).toHaveBeenCalledTimes(1);
  });

  it("defaultSort 未开 sortable：DEV 警告并忽略（R7）", () => {
    const { def } = makeTableRender({
      columns: [{ key: "age", title: "年龄", defaultSort: "asc" }],
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("sortable"));
    expect(def().sort.value).toBeUndefined();
  });

  it("多列 defaultSort：仅首个生效 + DEV 警告（R7）", () => {
    const { def } = makeTableRender({
      columns: [
        { key: "age", title: "年龄", sortable: true, defaultSort: "desc" },
        { key: "name", title: "姓名", sortable: true, defaultSort: "asc" },
      ],
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("defaultSort"));
    expect(def().sort.value).toEqual({ key: "age", direction: "desc" });
  });

  it("rowKey 字段缺失：索引兜底 + DEV 警告一次（R3）", () => {
    const { wrapper } = makeTableRender(
      { data: USERS, columns: [{ key: "name", title: "姓名" }] },
      { rowKey: "noSuchField" },
    );
    // rowKey 指向不存在的字段：每行退化为索引键，且只警告一次
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("rowKey"));
    // 25 条数据 / 默认每页 10 条 → 静态模式渲染首页 10 行
    expect(dataRows(wrapper)).toHaveLength(10);
  });
});

describe("defineColumns", () => {
  it("原样返回列数组，可直接喂给 defineTable（D9 可选）", () => {
    const columns = defineColumns<User>([
      { key: "id", title: "ID" },
      { key: "name", title: "姓名", sortable: true },
    ]);
    expect(columns).toHaveLength(2);

    const { wrapper } = makeTableRender({ columns });
    expect(dataRows(wrapper)).toHaveLength(10);
  });
});

describe("TableRender 行选择（S 系列）", () => {
  /** 取 tbody 数据行的选择控件（Ark control 元素；hidden input 不触发机器状态） */
  function rowChecks(wrapper: ReturnType<typeof mount>) {
    return wrapper
      .findAll("tbody tr:not([data-skeleton]):not([data-empty])")
      .map((tr) => tr.find('[data-part="control"]'));
  }

  /** checkbox 行控件勾选/取消（点击切换） */
  function checkRow(
    control: ReturnType<typeof mount>["find"] extends never ? never : any,
    on: boolean,
  ) {
    const state = control.attributes("data-state");
    if (on && state !== "checked") return control.trigger("click");
    if (!on && state === "checked") return control.trigger("click");
  }

  it("checkbox 简写：注入选择列、勾选更新 selectedKeys 并发出 selection-change（S2/S3/S7）", async () => {
    const { wrapper, def } = makeTableRender({ rowSelection: "checkbox" });
    const checks = rowChecks(wrapper);
    // 选择列注入：表头 3 格（选择列 + 业务列）
    expect(wrapper.findAll("thead th")).toHaveLength(3);
    expect(checks).toHaveLength(10);

    await checkRow(checks[0]!, true);
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));
    // 事件挂在 TableRender 组件上（Host 包装下需 findComponent）
    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("selection-change")?.at(-1)).toEqual([[USERS[0]]]);
    expect(table.emitted("update:selected-keys")?.at(-1)).toEqual([["1"]]);

    await checkRow(checks[0]!, false);
    expect(def().selectedKeys.value.size).toBe(0);
    wrapper.unmount();
  });

  it("表头全选为本页三态：全选 → 半选 → 全选恢复（S10）", async () => {
    const { wrapper, def } = makeTableRender({ rowSelection: "checkbox" });
    const headerControl = wrapper.find("thead [data-part='control']");
    await headerControl.trigger("click");
    expect(def().selectedKeys.value.size).toBe(10);
    // 全选后取消一行 → 表头半选
    await rowChecks(wrapper)[2]!.trigger("click");
    expect(wrapper.find("thead [data-part='control']").attributes("data-state")).toBe(
      "indeterminate",
    );
    // 再勾回 → 全选恢复
    await rowChecks(wrapper)[2]!.trigger("click");
    expect(def().selectedKeys.value.size).toBe(10);
    wrapper.unmount();
  });

  it("radio 简写：单选互斥，再点可取消（S4）", async () => {
    const { wrapper, def } = makeTableRender({ rowSelection: "radio" });
    const radios = () => wrapper.findAll("tbody input[type='radio']");
    // radio 交互走 click（原生 radio 重复点击不触发 change）
    await radios()[0]!.trigger("click");
    await radios()[3]!.trigger("click");
    expect(def().selectedKeys.value).toEqual(new Set(["4"]));
    // 再点已选中 → 取消
    await radios()[3]!.trigger("click");
    expect(def().selectedKeys.value.size).toBe(0);
    // radio 表头为占位（无全选框）
    expect(wrapper.find("thead input[type='checkbox']").exists()).toBe(false);
    wrapper.unmount();
  });

  it("radio cancelable: false：解绑最后一个选中被守卫（S4）", async () => {
    const { wrapper, def } = makeTableRender({
      rowSelection: { type: "radio", cancelable: false },
    });
    const radios = () => wrapper.findAll("tbody input[type='radio']");
    await radios()[0]!.trigger("click");
    await radios()[0]!.trigger("click");
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));
    wrapper.unmount();
  });

  it("selectable 谓词：不可选行置灰且被全选跳过（S5）", async () => {
    const { wrapper, def } = makeTableRender({
      rowSelection: { type: "checkbox", selectable: (r: User) => r.id % 2 === 1 },
    });
    // 第 2 行 id=2 不可选：control 带 disabled 态
    expect(rowChecks(wrapper)[1]!.attributes("data-disabled")).toBe("");
    await wrapper.find("thead [data-part='control']").trigger("click");
    // 本页 10 行中奇数 id 1,3,5,7,9
    expect(def().selectedKeys.value).toEqual(new Set(["1", "3", "5", "7", "9"]));
    wrapper.unmount();
  });

  it("跨页选中保留：翻页后 selection.value 返回完整行对象（S6）", async () => {
    const { wrapper, def } = makeTableRender({ rowSelection: "checkbox" });
    await checkRow(rowChecks(wrapper)[0]!, true);
    def().setPageIndex(2);
    await flushPromises();
    // 第 2 页行控件均未勾选，但选中集仍含第 1 页的 id=1
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));
    expect(def().selection.value).toEqual([USERS[0]]);
    wrapper.unmount();
  });

  it("reserveOnPageChange: false：数据窗口变化清空选中（S6）", async () => {
    const { wrapper, def } = makeTableRender({
      rowSelection: { type: "checkbox", reserveOnPageChange: false },
    });
    await checkRow(rowChecks(wrapper)[0]!, true);
    def().setPageIndex(2);
    await flushPromises();
    expect(def().selectedKeys.value.size).toBe(0);
    wrapper.unmount();
  });

  it("服务端模式：update() 重载后选中保留（S6）", async () => {
    const onLoad = vi.fn((params: TableLoadParams<User>) => {
      params.update(USERS.slice(0, params.page.pageIndex * 10));
    });
    const { wrapper, def } = makeTableRender({ onLoad, rowSelection: "checkbox" });
    await flushPromises();
    await checkRow(rowChecks(wrapper)[0]!, true);
    def().setPageIndex(2);
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));
    def().clearSelection();
    await flushPromises();
    expect(def().selectedKeys.value.size).toBe(0);
    wrapper.unmount();
  });

  it("setSelection / clearSelection 程序化出口（S12）", async () => {
    const { wrapper, def } = makeTableRender({ rowSelection: "checkbox" });
    def().setSelection([1, 2]);
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["1", "2"]));
    // 不存在的 key 保留（dirtyKeys 语义）
    def().setSelection([99]);
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["99"]));
    def().clearSelection();
    await flushPromises();
    expect(def().selectedKeys.value.size).toBe(0);
    wrapper.unmount();
  });

  it("setSelection 过滤不可选行：默认选中不落 selectable=false 的行（S5/S12）", async () => {
    const { wrapper, def } = makeTableRender({
      rowSelection: { type: "checkbox", selectable: (r: User) => r.id % 2 === 1 },
    });
    def().setSelection([1, 2, 3]); // id=2 不可选（偶数）
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["1", "3"]));
    // 待定 key（不在快照中）不受过滤拦截
    def().setSelection([99]);
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["99"]));
    wrapper.unmount();
  });

  it("rowKey 无效时 DEV 警告（S1）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({
          columns: baseColumns(),
          data: USERS,
          rowSelection: "checkbox",
        });
        // 组件 rowKey 为空串：选择引擎无法构造稳定行 id，禁用选择
        return () => h(TableRender, { rowKey: "", definition: box.def });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("rowSelection 需要有效的 rowKey"));
    // 选择列不渲染
    expect(wrapper.findAll("thead th")).toHaveLength(2);
    wrapper.unmount();
  });

  it("无 rowSelection 时无选择列，row-click 不被阻断", async () => {
    // 事件断言需直接挂 TableRender（拆分式）
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS },
      attachTo: document.body,
    });
    expect(wrapper.findAll("thead th")).toHaveLength(2);
    await wrapper.findAll("tbody tr")[0]!.trigger("click");
    expect(wrapper.emitted("row-click")).toHaveLength(1);
    wrapper.unmount();
  });
});
