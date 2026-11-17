import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import type { TableColumnOptions, TableDragSortPayload, TableRenderDefinition } from "./types";

interface User {
  id: number;
  name: string;
}

const USERS: User[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `用户${i + 1}` }));

afterEach(() => {
  vi.restoreAllMocks();
});

function baseColumns(): TableColumnOptions<User>[] {
  return [
    { key: "name", title: "姓名" },
    { key: "id", title: "ID", sortable: true },
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
  const wrapper = mount(Host);
  return { wrapper, def: box.def! };
}

/** 数据行（排除骨架/空态/错误态占位行） */
function dataRows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("tbody tr").filter((row) => !row.attributes("data-skeleton"));
}

function handles(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("[data-drag-handle]");
}

/** 派发可取消 Event 并返回事件本体（VTU trigger 返回 nextTick，拿不到 defaultPrevented） */
async function fire(el: Element, type: string): Promise<Event> {
  const event = new Event(type, { cancelable: true, bubbles: true });
  el.dispatchEvent(event);
  await flushPromises();
  return event;
}

/** 模拟一次完整拖拽：源行把手 dragstart → 目标行 dragover + drop → 源行把手 dragend。
 * dragover 后断言 preventDefault（真实浏览器 drop 前提，含让位后落在占位上的场景） */
async function dragRow(wrapper: ReturnType<typeof mount>, from: number, to: number) {
  const rows = dataRows(wrapper);
  await fire(handles(wrapper)[from].element, "dragstart");
  const overEvent = await fire(rows[to].element, "dragover");
  expect(overEvent.defaultPrevented).toBe(true);
  await fire(rows[to].element, "drop");
  await fire(handles(wrapper)[from].element, "dragend");
}

/** 当前页渲染出的姓名序列（启用把手列时首 td 为把手，姓名在次位） */
function renderedNames(wrapper: ReturnType<typeof mount>): string[] {
  return dataRows(wrapper).map((row) => {
    const tds = row.findAll("td");
    return (tds[0].find("[data-drag-handle]").exists() ? tds[1] : tds[0]).text();
  });
}

describe("TableRender 行拖拽排序（draggable）", () => {
  it("draggable: true 渲染把手列（表头占位 + 每行把手）", () => {
    const { wrapper } = makeTableRender({ draggable: true });
    expect(handles(wrapper)).toHaveLength(10);
    expect(wrapper.find("thead th .sr-only").text()).toBe("拖拽排序");
    // 把手列计入 colspan：空态横跨 业务列2 + 把手列1
    const empty = makeTableRender({ draggable: true, data: [] });
    expect(empty.wrapper.find("[data-empty] td").attributes("colspan")).toBe("3");
  });

  it("未配置 draggable 不渲染把手列（零回归）", () => {
    const { wrapper } = makeTableRender();
    expect(handles(wrapper)).toHaveLength(0);
  });

  it("静态模式：下移拖拽（0 → 2）引擎先行重排 + drag-sort 载荷口径", async () => {
    const { wrapper, def } = makeTableRender({ draggable: true });
    await dragRow(wrapper, 0, 2);

    const events = wrapper.findComponent(TableRender).emitted("drag-sort") as unknown as
      | [TableDragSortPayload][]
      | undefined;
    expect(events).toHaveLength(1);
    const payload = events![0][0];
    expect(payload.from).toBe(0);
    expect(payload.to).toBe(2);
    expect(payload.record).toEqual(USERS[0]);
    expect(payload.rows.map((r) => r.id)).toEqual([2, 3, 1, 4, 5, 6, 7, 8, 9, 10]);
    // 引擎内部全量数据已重排（渲染序列与载荷一致）
    expect(renderedNames(wrapper)).toEqual([
      "用户2",
      "用户3",
      "用户1",
      "用户4",
      "用户5",
      "用户6",
      "用户7",
      "用户8",
      "用户9",
      "用户10",
    ]);
    expect(def.table.getRowModel().rows.map((r) => r.original.id)).toEqual([
      2, 3, 1, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("静态模式：上移拖拽（3 → 1）落在目标之前", async () => {
    const { wrapper } = makeTableRender({ draggable: true });
    await dragRow(wrapper, 3, 1);
    expect(renderedNames(wrapper).slice(0, 4)).toEqual(["用户1", "用户4", "用户2", "用户3"]);
  });

  it("第 2 页拖拽不影响第 1 页数据（页内 → 全量映射）", async () => {
    const { wrapper, def } = makeTableRender({ draggable: true });
    def.setPageIndex(2);
    await flushPromises();
    expect(renderedNames(wrapper)[0]).toBe("用户11");

    await dragRow(wrapper, 0, 2);
    const payload = (wrapper.findComponent(TableRender).emitted("drag-sort") as any)[0][0];
    // 页内索引口径（不是全量 10/12）
    expect(payload.from).toBe(0);
    expect(payload.to).toBe(2);
    expect(payload.rows.map((r: User) => r.id)).toEqual([12, 13, 11, 14, 15, 16, 17, 18, 19, 20]);

    def.setPageIndex(1);
    await flushPromises();
    expect(renderedNames(wrapper).slice(0, 3)).toEqual(["用户1", "用户2", "用户3"]);
  });

  it("服务端模式：只发事件，不改内部数据", async () => {
    const pageData = USERS.slice(0, 10);
    const { wrapper, def } = makeTableRender({
      draggable: true,
      data: undefined,
      onLoad: ({ update }: any) => update(pageData, 25),
    });
    await flushPromises();
    await dragRow(wrapper, 0, 2);

    const events = wrapper.findComponent(TableRender).emitted("drag-sort");
    expect(events).toHaveLength(1);
    // 内部数据保持服务端原序（由调用方持久化后 reload）
    expect(def.table.getRowModel().rows.map((r) => r.original.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("实时让位：dragover 后未 drop 即见行序移动，被拖行渲染占位态", async () => {
    const { wrapper } = makeTableRender({ draggable: true });
    await handles(wrapper)[3].trigger("dragstart");
    expect(dataRows(wrapper)[3].classes()).toContain("opacity-50");
    expect(dataRows(wrapper)[3].classes()).toContain("[&>td]:outline-dashed");

    await dataRows(wrapper)[1].trigger("dragover");
    // 被拖行（用户4）已让位到索引 1，其余行相对序不变；尚未 drop、无事件
    expect(renderedNames(wrapper).slice(0, 4)).toEqual(["用户1", "用户4", "用户2", "用户3"]);
    expect(wrapper.findComponent(TableRender).emitted("drag-sort")).toBeUndefined();
    // 让位后光标恰停在被拖行占位上：dragover 仍须 preventDefault（真实浏览器 drop 前提），
    // 且不再移动预览序（天然不振荡）
    const overPlaceholder = await fire(dataRows(wrapper)[1].element, "dragover");
    expect(overPlaceholder.defaultPrevented).toBe(true);
    expect(renderedNames(wrapper).slice(0, 4)).toEqual(["用户1", "用户4", "用户2", "用户3"]);
    // 落在占位上 = 有效提交（真实浏览器最常见的落位方式）
    await dataRows(wrapper)[1].trigger("drop");
    await handles(wrapper)[3].trigger("dragend");
    const payload = (wrapper.findComponent(TableRender).emitted("drag-sort") as any)[0][0];
    expect(payload.from).toBe(3);
    expect(payload.to).toBe(1);
    expect(renderedNames(wrapper).slice(0, 4)).toEqual(["用户1", "用户4", "用户2", "用户3"]);
  });

  it("多跳预览提交等价于单次移动：载荷 from/to = 原位 → 最终预览位", async () => {
    const { wrapper, def } = makeTableRender({ draggable: true });
    await handles(wrapper)[0].trigger("dragstart");
    await dataRows(wrapper)[2].trigger("dragover"); // [2,3,1,4,...]
    await dataRows(wrapper)[3].trigger("dragover"); // [2,3,4,1,...]
    expect(renderedNames(wrapper).slice(0, 4)).toEqual(["用户2", "用户3", "用户4", "用户1"]);
    await dataRows(wrapper)[3].trigger("drop");
    await handles(wrapper)[0].trigger("dragend");

    const payload = (wrapper.findComponent(TableRender).emitted("drag-sort") as any)[0][0];
    expect(payload.from).toBe(0);
    expect(payload.to).toBe(3);
    expect(payload.rows.map((r: User) => r.id)).toEqual([2, 3, 4, 1, 5, 6, 7, 8, 9, 10]);
    expect(def.table.getRowModel().rows.map((r) => r.original.id)).toEqual([
      2, 3, 4, 1, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("取消路径（dragend 无 drop）：预览序弹回引擎原序，不发事件", async () => {
    const { wrapper } = makeTableRender({ draggable: true });
    await handles(wrapper)[0].trigger("dragstart");
    await dataRows(wrapper)[2].trigger("dragover");
    expect(renderedNames(wrapper).slice(0, 3)).toEqual(["用户2", "用户3", "用户1"]);
    await handles(wrapper)[0].trigger("dragend");
    expect(wrapper.findComponent(TableRender).emitted("drag-sort")).toBeUndefined();
    expect(renderedNames(wrapper).slice(0, 3)).toEqual(["用户1", "用户2", "用户3"]);
    expect(dataRows(wrapper)[0].classes()).not.toContain("opacity-50");
  });

  it("起拖时以离屏克隆整行作为拖拽快照（带边框 table），结束后清理", async () => {
    const { wrapper } = makeTableRender({ draggable: true });
    const setDragImage = vi.fn();
    const handle = handles(wrapper)[0];
    const event = new Event("dragstart", { cancelable: true, bubbles: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { effectAllowed: "", setData: vi.fn(), setDragImage },
    });
    handle.element.dispatchEvent(event);
    await flushPromises();
    expect(setDragImage).toHaveBeenCalledTimes(1);
    const snapshot = setDragImage.mock.calls[0][0] as HTMLElement;
    // 快照是离屏 table（border-separate 完整边框），内含克隆行内容
    expect(snapshot.tagName).toBe("TABLE");
    expect(snapshot.className).toContain("border-separate");
    expect(snapshot.textContent).toContain("用户1");
    expect(document.body.contains(snapshot)).toBe(true);
    // dragend（取消路径）清理快照节点
    await handle.trigger("dragend");
    expect(document.body.contains(snapshot)).toBe(false);
  });

  it("同源落位不发事件", async () => {
    const { wrapper } = makeTableRender({ draggable: true });
    await dragRow(wrapper, 1, 1);
    expect(wrapper.findComponent(TableRender).emitted("drag-sort")).toBeUndefined();
  });

  it("排序激活时把手置灰；取消排序恢复", async () => {
    const { wrapper, def } = makeTableRender({ draggable: true });
    expect(handles(wrapper)[0].attributes("disabled")).toBeUndefined();
    def.toggleSort("id");
    await flushPromises();
    expect(handles(wrapper)[0].attributes("disabled")).toBeDefined();
    // 排序态下即使派发事件也不重拖（未起拖 → dragover 不接收）
    const rows = dataRows(wrapper);
    await handles(wrapper)[0].trigger("dragstart");
    await rows[2].trigger("dragover");
    await rows[2].trigger("drop");
    await handles(wrapper)[0].trigger("dragend");
    expect(wrapper.findComponent(TableRender).emitted("drag-sort")).toBeUndefined();
    def.toggleSort("id");
    def.toggleSort("id"); // asc → desc → 取消
    await flushPromises();
    expect(handles(wrapper)[0].attributes("disabled")).toBeUndefined();
  });

  it("defaultSort 同传：DEV 警告 + 初始即禁用", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const columns = baseColumns();
    columns[1].defaultSort = "asc";
    const { wrapper } = makeTableRender({ draggable: true, columns });
    expect(spy.mock.calls.some((call) => String(call[0]).includes("初始排序"))).toBe(true);
    expect(handles(wrapper)[0].attributes("disabled")).toBeDefined();
  });

  it("行级谓词：draggable(record) 为 false 的行把手置灰", () => {
    const { wrapper } = makeTableRender({ draggable: { draggable: (r: User) => r.id !== 2 } });
    expect(handles(wrapper)[0].attributes("disabled")).toBeUndefined();
    expect(handles(wrapper)[1].attributes("disabled")).toBeDefined();
  });

  it("rowKey 记录级缺失：禁用拖拽 + DEV 警告一次", async () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const data = [{ id: 1, name: "甲" }, { name: "乙" }] as User[];
    const { wrapper } = makeTableRender({ draggable: true, data });
    await flushPromises();
    expect(handles(wrapper)[0].attributes("disabled")).toBeDefined();
    expect(
      spy.mock.calls.filter((call) => String(call[0]).includes("已禁用行拖拽排序")),
    ).toHaveLength(1);
  });

  it("tree 共存：DEV 警告并忽略 draggable", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({ draggable: true, tree: {} });
    expect(spy.mock.calls.some((call) => String(call[0]).includes("tree"))).toBe(true);
    expect(handles(wrapper)).toHaveLength(0);
  });

  it("virtual 共存：DEV 警告并忽略 draggable", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({ draggable: true, virtual: true, height: 300 });
    expect(spy.mock.calls.some((call) => String(call[0]).includes("virtual"))).toBe(true);
    expect(handles(wrapper)).toHaveLength(0);
  });

  it("选择列 + 把手列 + fixed-left 共存：sticky 偏移累计与 min-width 求和", () => {
    const columns: TableColumnOptions<User>[] = [
      { key: "name", title: "姓名", fixed: "left", width: 120 },
      { key: "id", title: "ID", width: 80 },
    ];
    const { wrapper } = makeTableRender({
      draggable: { width: 40 },
      rowSelection: "checkbox",
      columns,
    });
    const table = wrapper.find("table");
    // 选择 48 + 把手 40 + 业务列 120 + 80
    expect(table.attributes("style")).toContain("min-width: 288px");
    const headerCells = wrapper.findAll("thead th");
    // 选择列 offset 0；把手列 offset 48；fixed-left 业务列 offset 88
    expect(headerCells[0].attributes("style")).toContain("left: 0px");
    expect(headerCells[1].attributes("style")).toContain("left: 48px");
    expect(headerCells[2].attributes("style")).toContain("left: 88px");
    // 选择列/把手列均非交界（左组交界是最后一个 fixed-left 业务列，对齐既有 sticky 口径）
    expect(headerCells[0].classes()).not.toContain("border-r");
    expect(headerCells[1].classes()).not.toContain("border-r");
    expect(headerCells[2].classes()).toContain("border-r");
  });

  it("无 fixed-left 业务列时把手列是左 sticky 组交界（edge 边框）", () => {
    const { wrapper } = makeTableRender({ draggable: true, rowSelection: "checkbox" });
    const headerCells = wrapper.findAll("thead th");
    expect(headerCells[0].classes()).not.toContain("border-r");
    expect(headerCells[1].classes()).toContain("border-r");
  });

  it("加载骨架包含把手列占位", async () => {
    const { wrapper } = makeTableRender({
      draggable: true,
      data: undefined,
      onLoad: () => new Promise(() => {}),
    });
    await flushPromises();
    const skeleton = wrapper.findAll("tbody tr[data-skeleton]")[0];
    expect(skeleton.findAll("td")).toHaveLength(3); // 业务列2 + 把手列1
  });

  it("拆分式 prop draggable 生效；聚合式同传 DEV 警告并忽略 prop", async () => {
    const split = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS, draggable: true },
    });
    expect(split.findAll("[data-drag-handle]")).toHaveLength(10);
    await dragRow(split, 0, 2);
    expect(split.emitted("drag-sort")).toHaveLength(1);

    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    makeTableRender({}, { draggable: true });
    expect(
      spy.mock.calls.some((call) => String(call[0]).includes("draggable 请在 defineTable 配置")),
    ).toBe(true);
  });
});
