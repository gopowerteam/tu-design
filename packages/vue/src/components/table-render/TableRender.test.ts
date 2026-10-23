import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import type { Ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineForm } from "../form-render";
import type { FormRenderDefinition, FormRenderItem } from "../form-render/types";
import { defineColumns } from "./define-columns";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import type { ColumnRenders } from "./column-renders";
import type {
  SortableOptions,
  TableColumnOptions,
  TableLoadParams,
  TableRenderDefinition,
} from "./types";

// 虚拟滚动测试策略（务实取舍）：happy-dom 无 ResizeObserver、getBoundingClientRect 恒 0，
// 真实 virtualizer 的窗口计算不可靠（virtual-core 对缺失 ResizeObserver 静默跳过）。
// 这里 mock @tanstack/vue-virtual 为「scroll 事件驱动的固定行高窗口算法」fake：
// 保留 scroll 事件 → 窗口状态（shallowRef）→ computed → DOM 重渲染的真实链路，
// 只 fake 窗口算法本身；measureElement / getItemKey / scrollMargin / count 以传导断言覆盖。
const virtualMock = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock("@tanstack/vue-virtual", async () => {
  const { shallowRef, unref } = await import("vue");

  function createFake(options: any) {
    const ROW_H = 40;
    const items = shallowRef<any[]>([]);
    const total = { value: 0 };
    const measured: Element[] = [];
    let el: HTMLElement | null = null;

    function recompute() {
      const opts = unref(options);
      const viewport = el?.clientHeight || 200;
      const offset = Math.max(0, (el?.scrollTop ?? 0) - (opts.scrollMargin ?? 0));
      const start = Math.max(0, Math.floor(offset / ROW_H) - 2);
      const end = Math.min(opts.count, Math.ceil((offset + viewport) / ROW_H) + 2);
      const window: any[] = [];
      for (let i = start; i < end; i++) {
        window.push({
          index: i,
          start: i * ROW_H,
          end: (i + 1) * ROW_H,
          size: ROW_H,
          key: opts.getItemKey(i),
        });
      }
      items.value = window;
      total.value = opts.count * ROW_H;
    }

    return {
      get options() {
        return unref(options);
      },
      measured,
      getVirtualItems: () => items.value,
      getTotalSize: () => total.value,
      measureElement: (node: Element) => {
        measured.push(node);
      },
      // 真实 virtualizer 在滚动元素就绪后自动订阅；mock 由测试显式接线
      attach() {
        const opts = unref(options);
        el = opts.getScrollElement() as HTMLElement;
        el?.addEventListener("scroll", recompute);
        recompute();
      },
    };
  }

  return {
    useVirtualizer: (options: any) => {
      const instance = createFake(options);
      virtualMock.instances.push(instance);
      return shallowRef(instance);
    },
  };
});

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

/** 数据行（排除骨架行、空态行、错误占位行与虚拟占位行）单元格文本矩阵 */
function dataRows(wrapper: ReturnType<typeof mount>): string[][] {
  return wrapper
    .findAll(
      "tbody tr:not([data-skeleton]):not([data-empty]):not([data-error]):not([data-virtual-pad])",
    )
    .map((tr) => tr.findAll("td").map((td) => td.text()));
}

/** 接线滚动元素（真实 virtualizer 在挂载后自动订阅，mock 由测试显式触发） */
function attachVirtual() {
  const instance = virtualMock.instances.at(-1)!;
  instance.attach();
  return instance;
}

/** 单元格内联样式（sticky 断言用；DOMWrapper.element 是 Element，需收窄到 HTMLElement） */
function cellStyle(el: { element: Element }): CSSStyleDeclaration {
  return (el.element as HTMLElement).style;
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

  it("onLoad 抛错 → console.error 且渲染错误占位，组件不炸（R5）", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const onLoad = vi.fn(async () => {
      throw new Error("boom");
    });

    const { wrapper } = makeServerRender(onLoad);
    await flushPromises();

    expect(error).toHaveBeenCalled();
    // 错误态优先于空态：默认占位展示错误信息
    expect(wrapper.find("[data-error]").text()).toContain("boom");
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

// ---- 搜索表单联动（FormRender / search） -------------------------------------

interface Query {
  name: string;
}

function searchItems(): FormRenderItem<Query>[] {
  return [{ key: "name", title: "姓名", default: "" }];
}

function clickButton(wrapper: ReturnType<typeof mount>, text: string) {
  const target = wrapper.findAll("button").find((button) => button.text() === text);
  if (!target) throw new Error(`未找到按钮：${text}`);
  return target.trigger("click");
}

/**
 * 服务端模式 + search 表单：Host 在 setup 内 defineForm + defineTable（TanStack 约束）。
 * via = "config" 时 search 走 defineTable 配置；"prop" 时走组件 prop（回填装配口）。
 */
function makeSearchRender(
  onLoad: (params: TableLoadParams<User>) => void | Promise<unknown>,
  config: Record<string, unknown> = {},
  via: "config" | "prop" = "config",
) {
  const box: { def?: TableRenderDefinition<User>; form?: FormRenderDefinition<Query> } = {};
  const Host = defineComponent({
    setup() {
      const form = defineForm<Query>({ items: searchItems() });
      box.form = form;
      box.def = defineTable<User>({
        columns: baseColumns(),
        onLoad,
        ...(via === "config" ? { search: form } : {}),
        ...config,
      });
      return () =>
        h(TableRender, {
          rowKey: "id",
          definition: box.def,
          ...(via === "prop" ? { search: form } : {}),
        });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def!, form: () => box.form! };
}

describe("TableRender 搜索表单联动（search）", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it("onLoad 携带 search 表单当前值；未配置 search 时恒 {}", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 2), 2));
    const { wrapper, def, form } = makeSearchRender(onLoad);
    await flushPromises();

    // 首载即带 defaults
    expect(onLoad.mock.calls[0][0].form).toEqual({ name: "" });
    expect(def().search).toBe(form());

    // 输入后再取数（翻页）携带最新值
    await wrapper.find("input").setValue("用户1");
    def().setPageIndex(2);
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].form).toEqual({ name: "用户1" });
    wrapper.unmount();

    // 对照：未配置 search 的服务端表格恒为 {}
    const plainOnLoad = vi.fn(({ update }: any) => update([], 0));
    makeServerRender(plainOnLoad);
    await flushPromises();
    expect(plainOnLoad.mock.calls[0][0].form).toEqual({});
  });

  it("点击搜索：归位第 1 页、携带最新值并 emit search(values)", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, def } = makeSearchRender(onLoad);
    await flushPromises();

    def().setPageIndex(3);
    await flushPromises();

    await wrapper.find("input").setValue("张三");
    await clickButton(wrapper, "搜索");
    await flushPromises();

    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("search")?.at(-1)).toEqual([{ name: "张三" }]);
    const last = onLoad.mock.calls.at(-1)![0];
    expect(last.page.pageIndex).toBe(1);
    expect(last.form).toEqual({ name: "张三" });
    wrapper.unmount();
  });

  it("点击重置：重载读到 defaults 并 emit reset(values)，归位第 1 页", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, def } = makeSearchRender(onLoad);
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();
    await wrapper.find("input").setValue("临时值");
    await clickButton(wrapper, "搜索");
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].form).toEqual({ name: "临时值" });

    def().setPageIndex(4);
    await flushPromises();
    await clickButton(wrapper, "重置");
    await flushPromises();

    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("reset")?.at(-1)).toEqual([{ name: "" }]);
    const last = onLoad.mock.calls.at(-1)![0];
    expect(last.page.pageIndex).toBe(1);
    // TanStack reset 为同步 setState：reset 事件后 reload 读取即 defaults
    expect(last.form).toEqual({ name: "" });
    wrapper.unmount();
  });

  it("静态模式传 search：DEV 警告且不渲染搜索区", () => {
    const fakeSearch = {
      items: [] as FormRenderItem<Query>[],
      form: { state: { values: {} } } as FormRenderDefinition<Query>["form"],
      resetToDefaults: () => {},
    };
    const { wrapper, def } = makeTableRender({ data: USERS, search: fakeSearch });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("search 仅服务端模式生效"));
    expect(def().search).toBeUndefined();
    // 搜索区不渲染：静态表格无任何 input
    expect(wrapper.find("input").exists()).toBe(false);
    wrapper.unmount();
  });

  it("search 缺 form/items：DEV 警告并忽略", () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    const { def } = makeTableRender({
      onLoad,
      data: undefined,
      search: { items: [] } as never,
    });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("search 缺少 form 或 items"));
    expect(def().search).toBeUndefined();
  });

  it("聚合式 definition 与 prop 同传 search：definition 优先 + DEV 警告", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    const box: {
      def?: TableRenderDefinition<User>;
      a?: FormRenderDefinition<Query>;
      b?: FormRenderDefinition<Query>;
    } = {};
    const Host = defineComponent({
      setup() {
        box.a = defineForm<Query>({ items: searchItems() });
        box.b = defineForm<Query>({ items: searchItems() });
        box.def = defineTable<User>({ columns: baseColumns(), onLoad, search: box.a });
        return () => h(TableRender, { rowKey: "id", definition: box.def, search: box.b });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("聚合式下 search"));
    expect(box.def!.search).toBe(box.a);
    // B 未渲染：页面唯一的 input 属于 A，取数携带 A 的值
    await wrapper.find("input").setValue("A值");
    box.def!.reload();
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].form).toEqual({ name: "A值" });
    wrapper.unmount();
  });

  it("聚合式未配 search 时 prop 回填生效（不做聚合式忽略限制）", async () => {
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    const { wrapper, def, form } = makeSearchRender(onLoad, {}, "prop");
    await flushPromises();

    expect(def().search).toBe(form());
    await wrapper.find("input").setValue("回填值");
    await clickButton(wrapper, "搜索");
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].form).toEqual({ name: "回填值" });
    wrapper.unmount();
  });
});

// ---- 固定列（fixed / sticky） -------------------------------------------------

describe("TableRender 固定列（fixed）", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  // cellStyle 见文件级定义
  function fixedCols(): TableColumnOptions<User>[] {
    return [
      { key: "name", title: "姓名", width: 120, fixed: "left" },
      { key: "age", title: "年龄", width: 100, sortable: true },
      { key: "id", title: "ID", width: 80, fixed: "right" },
    ];
  }

  it("fixed 列渲染 sticky 样式与正确 offset；表头/数据行 z 分层且交界列带分隔边框", () => {
    const { wrapper } = makeTableRender({ columns: fixedCols() });

    const head = wrapper.findAll("thead th");
    // 姓名（fixed-left）：sticky left 0，表头 z 20，bg + 左组交界边框
    expect(cellStyle(head[0]).position).toBe("sticky");
    expect(cellStyle(head[0]).left).toBe("0px");
    expect(cellStyle(head[0]).zIndex).toBe("20");
    expect(head[0]!.classes()).toContain("bg-background");
    expect(head[0]!.classes()).toContain("border-r");
    // 年龄（普通列）：无 sticky
    expect(cellStyle(head[1]).position).toBe("");

    const tds = () => wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(cellStyle(tds()[0]).position).toBe("sticky");
    expect(cellStyle(tds()[0]).left).toBe("0px");
    expect(cellStyle(tds()[0]).zIndex).toBe("10"); // 表体 z 低于表头
    expect(cellStyle(tds()[1]).position).toBe("");
    // ID（fixed-right）：sticky right 0 + 右组交界边框
    expect(cellStyle(tds()[2]).right).toBe("0px");
    expect(tds()[2]!.classes()).toContain("bg-background");
    expect(tds()[2]!.classes()).toContain("border-l");
    wrapper.unmount();
  });

  it("多列 fixed-left 顺序累计 offset；多列 fixed-right 反向累计", () => {
    const { wrapper } = makeTableRender({
      columns: [
        { key: "a", title: "A", width: 100, fixed: "left" },
        { key: "b", title: "B", width: 80, fixed: "left" },
        { key: "c", title: "C", width: 90 },
        { key: "d", title: "D", width: 70, fixed: "right" },
        { key: "e", title: "E", width: 60, fixed: "right" },
      ],
    });

    const head = wrapper.findAll("thead th");
    expect(cellStyle(head[0]).left).toBe("0px");
    expect(head[0]!.classes()).not.toContain("border-r"); // 左组内部不加分隔
    expect(cellStyle(head[1]).left).toBe("100px"); // 100 + 0
    expect(head[1]!.classes()).toContain("border-r"); // 左组交界（靠内容侧）
    expect(cellStyle(head[3]).right).toBe("60px"); // D = E 宽 60
    expect(head[3]!.classes()).toContain("border-l"); // 右组交界（靠内容侧）
    expect(cellStyle(head[4]).right).toBe("0px");
    expect(head[4]!.classes()).not.toContain("border-l");
    wrapper.unmount();
  });

  it("选择列视作最左 sticky 列参与累计，fixed-left 业务列偏移累加选择列宽", () => {
    const { wrapper } = makeTableRender({
      columns: [
        { key: "name", title: "姓名", width: 120, fixed: "left" },
        { key: "age", title: "年龄", width: 100 },
      ],
      rowSelection: "checkbox",
    });

    const head = wrapper.findAll("thead th"); // [选择列, 姓名, 年龄]
    expect(cellStyle(head[0]).position).toBe("sticky");
    expect(cellStyle(head[0]).left).toBe("0px");
    expect(head[0]!.classes()).not.toContain("border-r"); // 与左组同侧，非交界
    expect(cellStyle(head[1]).left).toBe("48px"); // 0 + 选择列宽 48
    expect(head[1]!.classes()).toContain("border-r");

    const tds = wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(cellStyle(tds[0]).left).toBe("0px");
    expect(cellStyle(tds[1]).left).toBe("48px");
    wrapper.unmount();
  });

  it("仅 rowSelection 无 fixed 列：选择列 sticky，业务列不受影响", () => {
    const { wrapper } = makeTableRender({ rowSelection: "checkbox" });

    const head = wrapper.findAll("thead th");
    expect(cellStyle(head[0]).position).toBe("sticky");
    expect(cellStyle(head[0]).left).toBe("0px");
    expect(head[0]!.classes()).toContain("border-r"); // 唯一左 sticky → 交界
    expect(cellStyle(head[1]).position).toBe("");
    expect(cellStyle(head[2]).position).toBe("");
    wrapper.unmount();
  });

  it("fixed 缺数字 width：DEV 警告并降级普通列（字符串宽度同样降级）", () => {
    const { wrapper } = makeTableRender({
      columns: [
        { key: "name", title: "姓名", fixed: "left" }, // 无 width
        { key: "age", title: "年龄", width: "10rem", fixed: "left" }, // 字符串 width
        { key: "id", title: "ID", width: 80 },
      ],
    });

    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("已忽略 fixed"));
    const head = wrapper.findAll("thead th");
    expect(cellStyle(head[0]).position).toBe("");
    expect(cellStyle(head[1]).position).toBe("");
    wrapper.unmount();
  });

  it("加载骨架行的 fixed 列同 sticky 同 offset", async () => {
    const pending = deferred();
    const { wrapper } = makeServerRender(() => pending.promise, { columns: fixedCols() });
    await flushPromises();

    const tds = wrapper.findAll("tbody tr[data-skeleton]")[0]!.findAll("td");
    expect(cellStyle(tds[0]).position).toBe("sticky");
    expect(cellStyle(tds[0]).left).toBe("0px");
    expect(cellStyle(tds[1]).position).toBe("");
    expect(cellStyle(tds[2]).right).toBe("0px");

    pending.resolve();
    await flushPromises();
    wrapper.unmount();
  });

  it("无 fixed 列时无 sticky 样式（表头与数据行）", async () => {
    const { wrapper } = makeTableRender();
    await flushPromises();

    for (const th of wrapper.findAll("thead th")) {
      expect(cellStyle(th).position).toBe("");
    }
    for (const td of wrapper.findAll("tbody tr td")) {
      expect(cellStyle(td).position).toBe("");
    }
    wrapper.unmount();
  });
});

// ---- 虚拟滚动（virtual） -------------------------------------------------------

const USERS_1000: User[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 25 - (i % 25),
}));

describe("TableRender 虚拟滚动（virtual）", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    virtualMock.instances.length = 0;
  });

  afterEach(() => {
    warn.mockRestore();
  });

  // cellStyle 见文件级定义
  it("virtual + height 只渲染可见窗口行（远小于数据总量），配置传导正确", async () => {
    const { wrapper } = makeTableRender({
      data: USERS_1000,
      pageSize: 1000,
      virtual: true,
      height: 200,
    });
    await flushPromises();

    const instance = virtualMock.instances.at(-1)!;
    expect(instance.options.count).toBe(1000);
    expect(instance.options.getScrollElement()).toBeTruthy();
    expect(instance.options.scrollMargin).toBe(0); // happy-dom 下 thead offsetHeight 恒 0
    expect(instance.options.getItemKey(5)).toBe("6");

    attachVirtual();
    await flushPromises();

    const rows = dataRows(wrapper);
    expect(rows.length).toBeLessThan(20); // 窗口行远小于 1000
    expect(rows[0]).toEqual(["用户1", "25岁"]);

    // 滚动容器高度传导（数字 → px）与虚拟结构
    const container = wrapper.find(".overflow-x-auto");
    expect(container.attributes("style")).toContain("height: 200px");
    expect(container.attributes("style")).toContain("overflow-y: auto");
    expect(wrapper.findAll("[data-virtual-pad]")).toHaveLength(2);
    // measureElement 传导：窗口行全部请求过测量（去重后与行数一致）
    expect(new Set(instance.measured).size).toBe(rows.length);
    // 行 key = rowKey（DOM data-index 对应数据下标）
    expect(wrapper.find("tbody tr[data-index='0']")).toBeTruthy();
    wrapper.unmount();
  });

  it("滚动后渲染窗口更新（scroll 事件触发），行内容跟随新窗口", async () => {
    const { wrapper } = makeTableRender({
      data: USERS_1000,
      pageSize: 1000,
      virtual: true,
      height: 200,
    });
    await flushPromises();
    const instance = attachVirtual();
    await flushPromises();
    expect(dataRows(wrapper)[0]).toEqual(["用户1", "25岁"]);

    const el = instance.options.getScrollElement() as HTMLElement;
    el.scrollTop = 40_000; // 行高 40 × 1000 行 → 末尾窗口
    el.dispatchEvent(new Event("scroll"));
    await flushPromises();

    const rows = dataRows(wrapper);
    expect(rows.length).toBeLessThan(20);
    expect(rows[0]).not.toEqual(["用户1", "25岁"]); // 窗口已离开头部
    expect(rows.at(-1)).toEqual(["用户1000", "1岁"]); // 窗口覆盖末行
    wrapper.unmount();
  });

  it("虚拟行与固定列叠加：sticky 样式与 row-click 在虚拟行内保持", async () => {
    const onRowClick = vi.fn();
    const { wrapper } = makeTableRender(
      {
        data: USERS_1000,
        pageSize: 1000,
        virtual: true,
        height: 200,
        columns: [
          { key: "name", title: "姓名", width: 120, fixed: "left" },
          { key: "age", title: "年龄", width: 100 },
        ],
      },
      { onRowClick },
    );
    await flushPromises();
    attachVirtual();
    await flushPromises();

    const firstRow = wrapper.findAll("tbody tr:not([data-virtual-pad])")[0]!;
    const tds = firstRow.findAll("td");
    expect(cellStyle(tds[0]).position).toBe("sticky");
    expect(cellStyle(tds[0]).left).toBe("0px");
    expect(cellStyle(tds[1]).position).toBe("");

    await firstRow.trigger("click");
    expect(onRowClick).toHaveBeenCalled();
    wrapper.unmount();
  });

  it("virtual 缺 height：DEV 警告并降级普通渲染", () => {
    const { wrapper } = makeTableRender({ data: USERS, pageSize: 100, virtual: true });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("virtual 需要配置 height"));
    expect(dataRows(wrapper)).toHaveLength(25); // 全量渲染
    expect(wrapper.find("[data-virtual-pad]").exists()).toBe(false);
    expect(virtualMock.instances).toHaveLength(0); // 未创建 virtualizer
    expect(wrapper.find(".overflow-x-auto").attributes("style")).toBeUndefined();
    wrapper.unmount();
  });

  it("未开启 virtual 时全量渲染且无虚拟结构", () => {
    const { wrapper } = makeTableRender({ data: USERS, pageSize: 100 });

    expect(dataRows(wrapper)).toHaveLength(25);
    expect(wrapper.find("[data-virtual-pad]").exists()).toBe(false);
    expect(wrapper.find(".overflow-x-auto").attributes("style")).toBeUndefined();
    expect(virtualMock.instances).toHaveLength(0);
    wrapper.unmount();
  });
});

// ---- 树形数据（tree） -----------------------------------------------------------

interface Dept extends User {
  children?: Dept[];
}

const TREE: Dept[] = [
  {
    id: 1,
    name: "总部",
    age: 40,
    children: [
      {
        id: 11,
        name: "研发部",
        age: 30,
        children: [{ id: 111, name: "前端组", age: 25 }],
      },
      { id: 12, name: "市场部", age: 28 },
    ],
  },
  { id: 2, name: "分公司", age: 35 },
];

describe("TableRender 树形数据（tree）", () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
  });

  /** 首列内层 span（缩进容器；tree 启用时才有） */
  function indentSpan(tr: ReturnType<typeof mount>["find"] extends never ? never : any) {
    return tr.find("td span[style]");
  }

  it("有 children 的行渲染 caret 与 depth 缩进；叶子行无 caret", () => {
    const { wrapper } = makeTableRender({ data: TREE, pageSize: 100, tree: {} });

    // 默认全收起：总部、分公司
    expect(dataRows(wrapper)).toHaveLength(2);
    const rows = wrapper.findAll("tbody tr");
    // 总部 depth 0：缩进 0，有展开 caret
    expect(indentSpan(rows[0]).attributes("style")).toContain("margin-left: 0px");
    expect(rows[0].find('button[aria-label="展开"]').exists()).toBe(true);
    // 分公司叶子：无任何 button
    expect(rows[1].find("button").exists()).toBe(false);
    wrapper.unmount();
  });

  it("点击展开/收起：aria-expanded 翻转、子行出现/消失", async () => {
    const { wrapper } = makeTableRender({ data: TREE, pageSize: 100, tree: {} });
    const caret = () =>
      wrapper.find('tbody button[aria-label="展开"], tbody button[aria-label="收起"]');

    await caret().trigger("click");
    expect(dataRows(wrapper)).toHaveLength(4); // + 研发部、市场部
    expect(caret().attributes("aria-expanded")).toBe("true");
    expect(caret().attributes("aria-label")).toBe("收起");

    await caret().trigger("click");
    expect(dataRows(wrapper)).toHaveLength(2);
    expect(caret().attributes("aria-expanded")).toBe("false");
    wrapper.unmount();
  });

  it("defaultExpandAll 初始全展开；每层缩进按 indentSize 累计", () => {
    const { wrapper } = makeTableRender({
      data: TREE,
      pageSize: 100,
      tree: { defaultExpandAll: true },
    });

    expect(dataRows(wrapper)).toHaveLength(5); // 总部/研发部/前端组/市场部/分公司
    const rows = wrapper.findAll("tbody tr");
    expect(indentSpan(rows[0]).attributes("style")).toContain("margin-left: 0px");
    expect(indentSpan(rows[1]).attributes("style")).toContain("margin-left: 16px");
    expect(indentSpan(rows[2]).attributes("style")).toContain("margin-left: 32px");
    wrapper.unmount();
  });

  it("childrenKey 自定义子行字段", async () => {
    const CUSTOM: any[] = [
      { id: 1, name: "总部", age: 40, subs: [{ id: 11, name: "研发部", age: 30 }] },
    ];
    const { wrapper } = makeTableRender({
      data: CUSTOM,
      pageSize: 100,
      tree: { childrenKey: "subs" },
    });

    expect(dataRows(wrapper)).toHaveLength(1);
    await wrapper.find('tbody button[aria-label="展开"]').trigger("click");
    expect(dataRows(wrapper)).toHaveLength(2);
    expect(dataRows(wrapper)[1]).toEqual(["研发部", "30岁"]);
    wrapper.unmount();
  });

  it("caret 点击与 row-click 隔离（stop 修饰），行点击不受影响", async () => {
    const onRowClick = vi.fn();
    const { wrapper } = makeTableRender({ data: TREE, pageSize: 100, tree: {} }, { onRowClick });

    await wrapper.find('tbody button[aria-label="展开"]').trigger("click");
    expect(onRowClick).not.toHaveBeenCalled();
    expect(dataRows(wrapper)).toHaveLength(4);

    await wrapper.findAll("tbody tr")[0]!.trigger("click");
    expect(onRowClick).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("与 rowSelection 共存：子行独立可选，全选含展开子行", async () => {
    const { wrapper, def } = makeTableRender({
      data: TREE,
      pageSize: 100,
      tree: { defaultExpandAll: true },
      rowSelection: "checkbox",
    });

    // 全选作用本页展开后的全部行（父 + 子）
    await wrapper.find("thead [data-part='control']").trigger("click");
    expect(def().selectedKeys.value).toEqual(new Set(["1", "11", "111", "12", "2"]));

    // 单独勾选子行（第 2 行 = 研发部）
    def().clearSelection();
    await flushPromises(); // 受控控件 DOM 同步后再交互
    const controls = wrapper.findAll("tbody tr [data-part='control']");
    await controls[1]!.trigger("click");
    expect(def().selectedKeys.value).toEqual(new Set(["11"]));
    wrapper.unmount();
  });

  it("与 virtual 叠加：展开后 count 更新、窗口行包含子行", async () => {
    const data: any[] = USERS_1000.map((u, i) =>
      i === 0
        ? {
            ...u,
            children: [
              { id: 10001, name: "子行A", age: 1 },
              { id: 10002, name: "子行B", age: 2 },
            ],
          }
        : u,
    );
    const { wrapper } = makeTableRender({
      data,
      pageSize: 1000,
      virtual: true,
      height: 200,
      tree: {},
    });
    await flushPromises();
    const instance = attachVirtual();
    await flushPromises();
    expect(instance.options.count).toBe(1000);

    await wrapper.find('tbody button[aria-label="展开"]').trigger("click");
    await flushPromises();
    // 行模型 +2 实时传导（getter 实时反映 options computed）
    const exposedTable = (wrapper.findComponent(TableRender).vm as any).table;
    const oneCall = exposedTable.getRowModel().rows;
    // 展开先于分页（paginateExpandedRows 默认 true）：子行挤入分页窗口，
    // getRowModel().rows 恒为当前页行窗口（count 语义 = 窗口行数，非全树展开总数）
    expect(oneCall.length).toBe(1000);
    expect(oneCall.filter((r: any) => r.depth > 0)).toHaveLength(2);
    // count = 当前页行窗口（分页语义不变），展开的子行在窗口内出现
    expect(instance.options.count).toBe(1000);

    const rows = dataRows(wrapper);
    expect(rows.length).toBeLessThan(20); // 窗口行数仍受控
    expect(rows[1]).toEqual(["子行A", "1岁"]);
    expect(rows[2]).toEqual(["子行B", "2岁"]);
    wrapper.unmount();
  });

  it("与 sticky 首列叠加：缩进在 sticky 单元格内正常渲染", () => {
    const { wrapper } = makeTableRender({
      data: TREE,
      pageSize: 100,
      tree: { defaultExpandAll: true },
      columns: [
        { key: "name", title: "姓名", width: 120, fixed: "left" },
        { key: "age", title: "年龄" },
      ],
    });

    const rows = wrapper.findAll("tbody tr");
    expect(cellStyle(rows[0].find("td")).position).toBe("sticky");
    expect(indentSpan(rows[0]).attributes("style")).toContain("margin-left: 0px");
    expect(indentSpan(rows[1]).attributes("style")).toContain("margin-left: 16px");
    wrapper.unmount();
  });

  it("tree 配置无效：DEV 警告并忽略（非对象 / childrenKey 非字符串）", () => {
    makeTableRender({ data: TREE, pageSize: 100, tree: "no" as never });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("tree 必须是对象"));

    const { wrapper, def } = makeTableRender({
      data: TREE,
      pageSize: 100,
      tree: { childrenKey: 123 as never },
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("tree.childrenKey"));
    expect(def().tree).toBeUndefined();
    expect(dataRows(wrapper)).toHaveLength(2);
    wrapper.unmount();
  });

  it("服务端模式：children 随行数据返回，展开为纯客户端交互", async () => {
    const onLoad = vi.fn(({ update }: any) => update(TREE, 2));
    const { wrapper } = makeServerRender(onLoad, { tree: { defaultExpandAll: true } });
    await flushPromises();

    expect(dataRows(wrapper)).toHaveLength(5);
    await wrapper.find('tbody button[aria-label="收起"]').trigger("click");
    expect(dataRows(wrapper)).toHaveLength(2);
    expect(onLoad).toHaveBeenCalledTimes(1); // 展开不触发取数
    wrapper.unmount();
  });
});

// ---- 错误态（error / load-error / #error 插槽） --------------------------------

describe("TableRender 错误态（error）", () => {
  it("onLoad reject：error 投影 + load-error 事件 + 错误占位；重试成功后清除", async () => {
    let fail = true;
    const onLoad = vi.fn(async ({ update }: any) => {
      if (fail) throw new Error("网络错误");
      update(USERS.slice(0, 2), 2);
    });
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    // 投影与事件
    expect(def().error.value?.message).toBe("网络错误");
    const table = wrapper.findComponent(TableRender);
    const emitted = table.emitted("load-error") as unknown[][] | undefined;
    const firstError = emitted?.[0]?.[0] as Error | undefined;
    expect(firstError?.message).toBe("网络错误");
    // 错误占位（error 优先于数据/空态）：默认文案 = 错误 message + 重试按钮
    expect(wrapper.find("[data-error]").text()).toContain("网络错误");
    expect(wrapper.find("[data-error]").text()).toContain("重试");

    // 重试 → 新一轮 load 开始时清除 error
    fail = false;
    await clickButton(wrapper, "重试");
    await flushPromises();

    expect(def().error.value).toBeUndefined();
    expect(wrapper.find("[data-error]").exists()).toBe(false);
    expect(dataRows(wrapper)).toHaveLength(2);
    expect(onLoad).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it("error 插槽自定义占位（slot props { error, retry }）", async () => {
    let fail = true;
    const onLoad = vi.fn(async ({ update }: any) => {
      if (fail) throw new Error("超时");
      update(USERS.slice(0, 1), 1);
    });
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), onLoad },
      slots: {
        error: ({ error, retry }: any) =>
          h("div", { "data-custom-error": "" }, [
            h("span", { "data-custom-msg": "" }, error.message),
            h("button", { "data-custom-retry": "", onClick: retry }, "自定义重试"),
          ]),
      },
      attachTo: document.body,
    });
    await flushPromises();

    expect(wrapper.find("[data-custom-error]").exists()).toBe(true);
    expect(wrapper.find("[data-custom-msg]").text()).toBe("超时");
    // 插槽替换默认占位内容：按钮只剩插槽里的"自定义重试"
    const buttons = wrapper.findAll("[data-error] button").map((b) => b.text());
    expect(buttons).toEqual(["自定义重试"]);

    fail = false;
    await wrapper.find("[data-custom-retry]").trigger("click");
    await flushPromises();
    expect(wrapper.find("[data-custom-error]").exists()).toBe(false);
    expect(dataRows(wrapper)).toHaveLength(1);
    wrapper.unmount();
  });

  it("非 Error 抛出值归一化为 Error；静态模式不产生 error", async () => {
    const onLoad = vi.fn(() => Promise.reject("字符串错误"));
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    expect(def().error.value).toBeInstanceOf(Error);
    expect(def().error.value?.message).toContain("字符串错误");
    wrapper.unmount();

    // 静态模式不产生 error
    const plain = makeTableRender({ data: USERS.slice(0, 3) });
    expect(plain.def().error.value).toBeUndefined();
    expect(dataRows(plain.wrapper)).toHaveLength(3);
    plain.wrapper.unmount();
  });
});

// ---- ellipsis: "tooltip" --------------------------------------------------------

describe("TableRender ellipsis tooltip", () => {
  const tooltipContent = () =>
    document.querySelector<HTMLElement>('[data-scope="tooltip"][data-part="content"]');

  afterEach(() => {
    document.body.querySelectorAll('[data-scope="tooltip"]').forEach((n) => n.remove());
  });

  it("true 形态回归（truncate + title）；tooltip 形态无原生 title 且渲染 Tooltip 结构", async () => {
    const { wrapper } = makeTableRender({
      columns: [
        { key: "name", title: "姓名", ellipsis: "tooltip" },
        { key: "age", title: "年龄", formatter: (r: User) => `${r.age}岁`, ellipsis: true },
        { key: "id", title: "ID" },
      ],
    });
    const tds = wrapper.findAll("tbody tr")[0]!.findAll("td");

    // tooltip 形态：不设原生 title，内容由 Ark Trigger（asChild）承载
    expect(tds[0]!.attributes("title")).toBeUndefined();
    expect(tds[0]!.find('[data-part="trigger"]').exists()).toBe(true);
    // true 形态回归：原生 title
    expect(tds[1]!.attributes("title")).toBe("25岁");
    // 未配置：无 title 无 trigger
    expect(tds[2]!.attributes("title")).toBeUndefined();
    expect(tds[2]!.find('[data-part="trigger"]').exists()).toBe(false);

    // hover 显示完整文本（Content portal 到 body）
    await tds[0]!.find('[data-part="trigger"]').trigger("pointermove");
    await vi.waitFor(() => expect(tooltipContent()?.dataset.state).toBe("open"));
    expect(tooltipContent()!.textContent).toContain("用户1");
    wrapper.unmount();
  });

  it("tooltip 形态的 render 列：cloneVNode 复制渲染正常、交互保持（实测结论：稳定可用）", async () => {
    const onEdit = vi.fn();
    const { wrapper } = makeTableRender({
      columns: [
        {
          key: "name",
          title: "姓名",
          ellipsis: "tooltip",
          render: (rr: ColumnRenders<User>) =>
            rr.render((record: User) =>
              h("button", { type: "button", onClick: () => onEdit(record) }, `编辑${record.name}`),
            ),
        },
      ],
    });
    const td = wrapper.findAll("tbody tr")[0]!.find("td");
    // cloneVNode 复制进 Trigger：内容正常渲染（无二次挂载告警/报错）
    const btn = td.find("button");
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe("编辑用户1");
    // asChild 行为合并成功：按钮节点带上 Ark trigger 属性
    expect(btn.attributes("data-part")).toBe("trigger");
    // 交互保持：点击回调携带原始 record
    await btn.trigger("click");
    expect(onEdit).toHaveBeenCalledWith(USERS[0]);
    wrapper.unmount();
  });

  it("tooltip 列不再设置原生 title，且截断样式由内部元素承载", () => {
    const { wrapper } = makeTableRender({
      columns: [{ key: "name", title: "姓名", ellipsis: "tooltip" }],
    });
    const td = wrapper.findAll("tbody tr")[0]!.find("td");
    expect(td.classes()).not.toContain("truncate"); // td 不再截断
    expect(td.find("span.truncate").exists()).toBe(true); // 截断在 Trigger 内容上
    wrapper.unmount();
  });
});

// ---- 行事件补齐（row-dblclick / row-contextmenu / cell-click） ------------------

describe("TableRender 行事件补齐", () => {
  function makeEventProps() {
    return {
      onRowClick: vi.fn(),
      onRowDblclick: vi.fn(),
      onRowContextmenu: vi.fn(),
      onCellClick: vi.fn(),
    };
  }

  it("普通分支：三事件触发且参数正确；cell-click 与 row-click 冒泡并存", async () => {
    const evts = makeEventProps();
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS.slice(0, 3), ...evts },
      attachTo: document.body,
    });
    const firstRow = wrapper.findAll("tbody tr")[0]!;

    await firstRow.trigger("dblclick");
    expect(evts.onRowDblclick).toHaveBeenCalledTimes(1);
    expect(evts.onRowDblclick.mock.calls[0]![0]).toEqual(USERS[0]);
    expect(evts.onRowDblclick.mock.calls[0]![1]).toBe(0);
    expect((evts.onRowDblclick.mock.calls[0]![2] as Event).type).toBe("dblclick");

    await firstRow.trigger("contextmenu");
    expect(evts.onRowContextmenu).toHaveBeenCalledTimes(1);
    expect((evts.onRowContextmenu.mock.calls[0]![2] as Event).type).toBe("contextmenu");

    await firstRow.findAll("td")[0]!.trigger("click");
    expect(evts.onCellClick).toHaveBeenCalledTimes(1);
    expect(evts.onCellClick.mock.calls[0]!.slice(0, 3)).toEqual([USERS[0], "name", 0]);
    // 冒泡并存（预期）：cell 触发时 row-click 同步触发
    expect(evts.onRowClick).toHaveBeenCalledTimes(1);

    wrapper.unmount();
  });

  it("虚拟分支：三事件同样触发且参数正确", async () => {
    const evts = makeEventProps();
    const { wrapper } = makeTableRender(
      { data: USERS_1000, pageSize: 1000, virtual: true, height: 200 },
      evts,
    );
    await flushPromises();
    attachVirtual();
    await flushPromises();

    const firstRow = wrapper.findAll("tbody tr:not([data-virtual-pad])")[0]!;
    await firstRow.trigger("dblclick");
    await firstRow.trigger("contextmenu");
    await firstRow.findAll("td")[0]!.trigger("click");

    expect(evts.onRowDblclick).toHaveBeenCalledTimes(1);
    expect(evts.onRowDblclick.mock.calls[0]![0]).toEqual(USERS_1000[0]);
    expect(evts.onRowContextmenu).toHaveBeenCalledTimes(1);
    expect(evts.onCellClick.mock.calls[0]!.slice(0, 3)).toEqual([USERS_1000[0], "name", 0]);
    expect(evts.onRowClick).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });
});

// ---- 受控模式（v-model，D11） ----------------------------------------------------

describe("TableRender 受控模式（v-model）", () => {
  /** 受控 Host：四个受控 ref + v-model 回写闭环（服务端模式便于 onLoad 计数） */
  function makeControlledRender(
    onLoad: (params: TableLoadParams<User>) => void | Promise<unknown>,
    extra: Record<string, unknown> = {},
  ) {
    const state = {
      pageIndex: ref(1),
      pageSize: ref(10),
      sort: ref(undefined) as Ref<SortableOptions | undefined>,
      selectedKeys: ref([]) as Ref<Array<string | number>>,
    };
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({
          columns: baseColumns(),
          onLoad,
          pageIndex: state.pageIndex,
          pageSize: state.pageSize,
          sort: state.sort,
          selectedKeys: state.selectedKeys,
          ...extra,
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            pageIndex: state.pageIndex.value,
            "onUpdate:page-index": (v: number) => {
              state.pageIndex.value = v;
            },
            pageSize: state.pageSize.value,
            "onUpdate:page-size": (v: number) => {
              state.pageSize.value = v;
            },
            sort: state.sort.value,
            selectedKeys: state.selectedKeys.value,
            "onUpdate:selected-keys": (keys: Array<string | number>) => {
              state.selectedKeys.value = keys;
            },
            ...extra,
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    return { wrapper, def: () => box.def!, state };
  }

  it("受控 pageIndex 外部变更 → 页面迁移 + 服务端模式触发重载", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 3), 100));
    const { wrapper, def, state } = makeControlledRender(onLoad);
    await flushPromises();

    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad.mock.calls[0]![0].page.pageIndex).toBe(1);

    state.pageIndex.value = 2;
    await flushPromises();

    expect(def().page.pageIndex).toBe(2);
    expect(onLoad).toHaveBeenCalledTimes(2);
    expect(onLoad.mock.calls[1]![0].page.pageIndex).toBe(2);
    wrapper.unmount();
  });

  it("双向闭环：内部翻页 emit → 父层回写，无重复 onLoad、无事件重复", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, state } = makeControlledRender(onLoad);
    await flushPromises();
    expect(onLoad).toHaveBeenCalledTimes(1);

    // 内部交互：分页条点击「下一页」
    await clickButton(wrapper, "下一页");
    await flushPromises();

    expect(state.pageIndex.value).toBe(2); // 父层收到通知并回写
    expect(onLoad).toHaveBeenCalledTimes(2); // 仅翻页重载一次
    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("update:page-index")).toHaveLength(1); // 无「动作 + 回弹」双发
    wrapper.unmount();
  });

  it("受控 selectedKeys 外部变更 → 勾选 UI 更新；selectable 过滤生效；内部交互回写闭环", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 5), 5));
    const { wrapper, def, state } = makeControlledRender(onLoad, {
      rowSelection: { type: "checkbox", selectable: (r: User) => r.id % 2 === 1 },
    });
    await flushPromises();

    // 外部勾选（含偶数 id=2，应被 S5 selectable 过滤）
    state.selectedKeys.value = ["1", "2"];
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["1"]));

    const controls = () => wrapper.findAll("tbody tr [data-part='control']");
    expect(controls()[0]!.attributes("data-state")).toBe("checked"); // UI 同步

    // 内部交互（第 3 行 id=3 可选）→ 父层回写闭环
    await controls()[2]!.trigger("click");
    await flushPromises();
    expect(def().selectedKeys.value).toEqual(new Set(["1", "3"]));
    expect(state.selectedKeys.value).toEqual(["1", "3"]);
    wrapper.unmount();
  });

  it("受控 sort 外部变更 → 排序应用 + 服务端重载归位第 1 页（R8）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 3), 100));
    const { wrapper, def, state } = makeControlledRender(onLoad);
    await flushPromises();
    expect(onLoad).toHaveBeenCalledTimes(1);

    def().setPageIndex(3);
    await flushPromises();
    expect(onLoad.mock.calls.at(-1)![0].page.pageIndex).toBe(3);

    state.sort.value = { key: "age", direction: "desc" };
    await flushPromises();

    expect(def().sort.value).toEqual({ key: "age", direction: "desc" });
    const last = onLoad.mock.calls.at(-1)![0];
    expect(last.sort).toEqual({ key: "age", direction: "desc" });
    expect(last.page.pageIndex).toBe(1); // 排序变化归位
    wrapper.unmount();
  });

  it("受控 sort 指向不可排序列：DEV 警告并忽略", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onLoad = vi.fn(({ update }: any) => update([], 0));
    const { def, state } = makeControlledRender(onLoad);
    await flushPromises();

    state.sort.value = { key: "name", direction: "asc" }; // baseColumns 的 name 列不可排序
    await flushPromises();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("不可排序列"));
    expect(def().sort.value).toBeUndefined();
  });

  it("混用：pageSize 受控、pageIndex 非受控 → R9 内部归位 + update:page-index 通知", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 20), 100));
    const pageSize = ref(10);
    const box: { def?: TableRenderDefinition<User> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<User>({
          columns: baseColumns(),
          onLoad,
          pageSize, // 仅 pageSize 受控；pageIndex 保持非受控
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            pageSize: pageSize.value,
            "onUpdate:page-size": (v: number) => {
              pageSize.value = v;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    box.def!.setPageIndex(3);
    await flushPromises();
    expect(box.def!.page.pageIndex).toBe(3);

    pageSize.value = 20;
    await flushPromises();

    expect(box.def!.page.pageSize).toBe(20);
    expect(box.def!.page.pageIndex).toBe(1); // R9：pageIndex 未受控时内部归位
    const table = wrapper.findComponent(TableRender);
    expect(table.emitted("update:page-index")?.at(-1)).toEqual([1]); // 归位事件通知
    wrapper.unmount();
  });

  it("prop 缺省：非受控行为不变（翻页/排序/选择冒烟）", async () => {
    const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 10), 100));
    const { wrapper, def } = makeServerRender(onLoad);
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();
    expect(def().page.pageIndex).toBe(2);

    def().toggleSort("age");
    await flushPromises();
    // R8：排序变化归位第 1 页
    expect(def().page.pageIndex).toBe(1);
    expect(def().sort.value).toEqual({ key: "age", direction: "asc" });
    expect(onLoad).toHaveBeenCalledTimes(3); // 初始 + 翻页 + 排序（无重复）
    wrapper.unmount();
  });
});
