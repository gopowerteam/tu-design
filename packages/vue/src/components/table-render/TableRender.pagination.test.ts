import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";
import TablePagination from "./TablePagination.vue";
import type { DefineTableOptions, TableColumnOptions, TableRenderDefinition } from "./types";

interface Row {
  id: number;
  name: string;
  children?: Row[];
}

const ROWS: Row[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
}));

const TREE: Row[] = [
  {
    id: 1,
    name: "总部",
    children: [
      { id: 11, name: "研发" },
      { id: 12, name: "市场" },
      { id: 13, name: "人力" },
    ],
  },
  {
    id: 2,
    name: "分部",
    children: [
      { id: 21, name: "销售" },
      { id: 22, name: "渠道" },
      { id: 23, name: "售后" },
    ],
  },
];

const COLUMNS: TableColumnOptions<Row>[] = [
  { key: "id", title: "ID", width: 80 },
  { key: "name", title: "姓名" },
];

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeHost(config: Partial<DefineTableOptions<Row>>, props: Record<string, unknown> = {}) {
  const box: { def?: TableRenderDefinition<Row> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<Row>({ columns: COLUMNS, ...config });
      return () => h(TableRender, { rowKey: "id", definition: box.def, ...props });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def! };
}

/** 数据行（排除骨架/空态/错误/虚拟占位） */
function dataRows(wrapper: ReturnType<typeof mount>) {
  return wrapper
    .findAll(
      "tbody tr:not([data-skeleton]):not([data-empty]):not([data-error]):not([data-virtual-pad])",
    )
    .map((tr) => tr.findAll("td").map((td) => td.text()));
}

describe("TableRender 本地分页（pageCount / total / clamp）", () => {
  it("扁平静态：total/pageCount 正确，翻页窗口正确", async () => {
    const { wrapper, def } = makeHost({ data: ROWS, pageSize: 10 });
    await flushPromises();

    expect(def().page.total).toBe(100);
    expect(def().page.pageCount).toBe(10);
    expect(dataRows(wrapper)).toHaveLength(10);

    def().setPageIndex(2);
    await flushPromises();
    expect(dataRows(wrapper)[0]![1]).toBe("用户11");
  });

  it("树形 + 本地分页：total 含展开子行，分页条可达第 2 页；收起后钳制页码", async () => {
    const { wrapper, def } = makeHost({
      data: TREE,
      pageSize: 4,
      tree: { defaultExpandAll: true },
    });
    await flushPromises();

    expect(def().page.total).toBe(8);
    expect(def().page.pageCount).toBe(2);
    expect(wrapper.find("[data-table-pagination]").exists()).toBe(true);

    def().setPageIndex(2);
    await flushPromises();
    expect(dataRows(wrapper)).toHaveLength(4);
    expect(dataRows(wrapper)[0]![1]).toBe("分部");

    // 全部收起 → 可见行数降为 2，页码钳制到第 1 页
    def().table.toggleAllRowsExpanded(false);
    await flushPromises();
    expect(def().page.total).toBe(2);
    expect(def().page.pageIndex).toBe(1);
  });

  it("paginateExpandedRows: false → 先分页后展开：单页可超 pageSize，total 按顶层行", async () => {
    const { wrapper, def } = makeHost({
      data: TREE,
      pageSize: 1,
      tree: { defaultExpandAll: true, paginateExpandedRows: false },
    });
    await flushPromises();

    expect(def().page.total).toBe(2);
    expect(def().page.pageCount).toBe(2);
    // 顶层 1 行 + 其 3 个子行同页
    expect(dataRows(wrapper).length).toBeGreaterThan(1);
  });

  it("服务端 total 缩水：页码钳制到末页", async () => {
    let total = 100;
    const onLoad = vi.fn(({ update }: any) => update([], total));
    const { def } = makeHost({ onLoad, data: undefined });
    await flushPromises();

    def().setPageIndex(10);
    await flushPromises();
    expect(def().page.pageIndex).toBe(10);

    total = 20;
    def().reload();
    await flushPromises();
    expect(def().page.pageCount).toBe(2);
    expect(def().page.pageIndex).toBe(2);
  });
});

describe("TableRender 自动归位 / 受控通知", () => {
  it("静态数据缩水：默认回第 1 页", async () => {
    const data = ref(ROWS.slice());
    const { def } = makeHost({ data, pageSize: 10 });
    await flushPromises();

    def().setPageIndex(10);
    await flushPromises();

    data.value = ROWS.slice(0, 12);
    await flushPromises();
    expect(def().page.pageIndex).toBe(1);
  });

  it("autoResetPageIndex: false → 保持当前页，仅越界钳制", async () => {
    const data = ref(ROWS.slice());
    const { def } = makeHost({ data, pageSize: 10, autoResetPageIndex: false });
    await flushPromises();

    def().setPageIndex(5);
    await flushPromises();

    data.value = ROWS.slice(0, 70); // 7 页，第 5 页仍有效
    await flushPromises();
    expect(def().page.pageIndex).toBe(5);

    data.value = ROWS.slice(0, 12); // 2 页 → 钳到末页
    await flushPromises();
    expect(def().page.pageIndex).toBe(2);
  });

  it("静态数据缩水：受控 pageIndex 只回写最终第 1 页（无中间钳制值）", async () => {
    const data = ref(ROWS.slice());
    const pageIndex = ref(10);
    const box: { def?: TableRenderDefinition<Row> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Row>({
          data,
          pageSize: 10,
          pageIndex,
          columns: COLUMNS,
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            pageIndex: pageIndex.value,
            "onUpdate:page-index": (value: number) => {
              pageIndex.value = value;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();
    expect(box.def!.page.pageIndex).toBe(10);

    data.value = ROWS.slice(0, 12);
    await flushPromises();

    expect(box.def!.page.pageIndex).toBe(1);
    expect(pageIndex.value).toBe(1);
    const values = (
      wrapper.findComponent(TableRender).emitted("update:page-index") as number[][]
    ).map((args) => args[0]);
    expect(values).not.toContain(2); // 不得先钳到末页再归位
    expect(values.at(-1)).toBe(1);
    wrapper.unmount();
  });

  it("初始受控越界：onMounted 钳制并回写（仅 definition 受控）", async () => {
    const pageIndex = ref(9);
    const box: { def?: TableRenderDefinition<Row> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Row>({
          data: ROWS.slice(0, 25),
          pageSize: 10,
          pageIndex,
          columns: COLUMNS,
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            "onUpdate:page-index": (value: number) => {
              pageIndex.value = value;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    expect(box.def!.page.pageCount).toBe(3);
    expect(box.def!.page.pageIndex).toBe(3);
    expect(pageIndex.value).toBe(3);
    wrapper.unmount();
  });

  it("服务端 total 缩水：受控模式下修正值 emit 一次", async () => {
    let total = 100;
    const pageIndex = ref(1);
    const onLoad = vi.fn(({ update }: any) => update([], total));
    const box: { def?: TableRenderDefinition<Row> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Row>({
          columns: COLUMNS,
          onLoad,
          pageIndex,
        });
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: box.def,
            pageIndex: pageIndex.value,
            "onUpdate:page-index": (value: number) => {
              pageIndex.value = value;
            },
          });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    box.def!.setPageIndex(10);
    await flushPromises();
    expect(box.def!.page.pageIndex).toBe(10);

    total = 20;
    box.def!.reload();
    await flushPromises();

    expect(box.def!.page.pageIndex).toBe(2);
    expect(pageIndex.value).toBe(2);
    const emitted = wrapper.findComponent(TableRender).emitted("update:page-index") as number[][];
    expect(emitted.at(-1)).toEqual([2]);
    wrapper.unmount();
  });
});

describe("TableRender 序号 / 页大小 / 状态投影", () => {
  it("serial 为页内序号：第 2 页从 base 重计", async () => {
    const columns: TableColumnOptions<Row>[] = [
      { key: "seq", title: "#", width: 56, render: (r) => r.serial() },
      ...COLUMNS,
    ];
    const { wrapper, def } = makeHost({ data: ROWS.slice(0, 12), pageSize: 5, columns });
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();
    const rows = dataRows(wrapper);
    expect(rows.map((row) => row[0])).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("自定义 render 第 4 参携带页内上下文", async () => {
    const contexts: Array<{ pageRowIndex: number; pageIndex: number; pageSize: number }> = [];
    const columns: TableColumnOptions<Row>[] = [
      {
        key: "ctx",
        title: "ctx",
        render: (r) =>
          r.render((_record, _index, _column, context) => {
            if (context) contexts.push(context);
            return String(context?.pageRowIndex ?? -1);
          }),
      },
      ...COLUMNS,
    ];
    const { def } = makeHost({ data: ROWS.slice(0, 12), pageSize: 5, columns });
    await flushPromises();

    def().setPageIndex(2);
    await flushPromises();

    expect(contexts.at(-1)).toEqual({ pageRowIndex: 4, pageIndex: 2, pageSize: 5 });
  });

  it("pageSize 不在 pageSizeOpts 时，下拉自动补齐当前值", async () => {
    const { wrapper } = makeHost({
      data: ROWS.slice(0, 70),
      pageSize: 30,
      pageSizeOpts: [10, 20],
    });
    await flushPromises();

    const options = wrapper
      .findAll("[data-table-pagination] select option")
      .map((option) => option.attributes("value"));
    expect(options).toContain("30");
  });

  it("resetPageOnPageSizeChange: false → 沿用 v9 保首行语义", async () => {
    const { def } = makeHost({
      data: ROWS,
      pageSize: 10,
      resetPageOnPageSizeChange: false,
    });
    await flushPromises();

    def().setPageIndex(3);
    await flushPromises();
    def().setPageSize(20);
    await flushPromises();

    // 旧首行 index 20 → 新容量下为第 2 页
    expect(def().page.pageIndex).toBe(2);
  });

  it("definition.loading / definition.error 在静态模式生效", async () => {
    const loading = ref(true);
    const { wrapper } = makeHost({ data: ROWS, pageSize: 10, loading });
    await flushPromises();
    expect(wrapper.findAll("[data-skeleton]")).toHaveLength(5);

    loading.value = false;
    await flushPromises();
    expect(wrapper.findAll("[data-skeleton]")).toHaveLength(0);

    const error = ref<Error | undefined>(new Error("本地加载失败"));
    const errored = makeHost({ data: [], pageSize: 10, error });
    await flushPromises();
    expect(errored.wrapper.find("[data-error]").exists()).toBe(true);
  });
});

describe("TablePagination 修正通知", () => {
  it("definition 受控时，非动作路径的页码变化会 emit", async () => {
    const pageIndex = ref(1);
    const onLoad = vi.fn(({ update }: any) => update([], 100));
    const box: { def?: TableRenderDefinition<Row> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Row>({ columns: COLUMNS, onLoad, pageIndex });
        return () => h(TablePagination, { definition: box.def });
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();

    box.def!.setPageIndex(99); // 引擎钳制到末页 10
    await flushPromises();

    const emitted = wrapper
      .findComponent(TablePagination)
      .emitted("update:pageIndex") as number[][];
    expect(emitted.at(-1)).toEqual([10]);
    wrapper.unmount();
  });
});
