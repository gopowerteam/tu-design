import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import type { TableColumnNode, TableColumnOptions, TableRenderDefinition } from "./types";
import TableRender from "./TableRender.vue";

// 边框与条纹（正交模型）测试：bordered 仅外框，网格线由 single-* 独立开关，条纹按行模型索引奇偶。
// 断言口径为类名级（happy-dom 无布局）；级联/贴叠/颜色生成类行为由文档站真实浏览器目验把关。

interface User {
  id: number;
  name: string;
  age: number;
}

// 25 条数据：默认分页下 >10 条，保证内置分页条渲染（border-t 退役断言依赖）
const USERS: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 30 - i,
}));

function baseColumns(): TableColumnOptions<User>[] {
  return [
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄" },
  ];
}

/** 双固定列：左固定姓名（edge）+ 右固定年龄（edge），验证交界边框与列线的让位协同 */
function fixedColumns(): TableColumnOptions<User>[] {
  return [
    { key: "name", title: "姓名", fixed: "left", width: 100 },
    { key: "age", title: "年龄", fixed: "right", width: 80 },
  ];
}

/** 双分组 × 双叶子：多行表头（分组列线结构性 + 叶子列线开关） */
function groupColumns(): TableColumnNode<User>[] {
  return [
    {
      key: "g1",
      title: "基础信息",
      children: [
        { key: "name", title: "姓名" },
        { key: "age", title: "年龄" },
      ],
    },
    {
      key: "g2",
      title: "扩展信息",
      children: [
        { key: "city", title: "城市" },
        { key: "score", title: "积分" },
      ],
    },
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
  return { wrapper: mount(Host, { attachTo: document.body }) };
}

/** 同上，但列形态可变（固定列/分组列用例） */
function makeTableRenderWith(
  columns: TableColumnNode<User>[],
  config: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({ columns, data: USERS, ...config });
      return () => h(TableRender, { rowKey: "id", definition: box.def, ...props });
    },
  });
  return { wrapper: mount(Host, { attachTo: document.body }) };
}

/** 数据行（剔除骨架行；happy-dom 下虚拟窗口可能为空，virtual 场景不适用此函数） */
function dataRows(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("tbody tr:not([data-skeleton])");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableRender 边框正交模型：默认形态", () => {
  it("默认 bordered=true：table 挂外框；td 行线在；td/th 无列线（正交模型默认无列线）", () => {
    const { wrapper } = makeTableRender();
    const table = wrapper.find("table").classes();
    expect(table).toContain("border");
    expect(table).toContain("border-border");
    const tr = dataRows(wrapper)[0]!;
    for (const td of tr.findAll("td")) {
      expect(td.classes()).toContain("border-b");
      expect(td.classes()).not.toContain("border-r");
    }
    const ths = wrapper.findAll("thead th");
    for (const th of ths) {
      expect(th.classes()).toContain("border-b");
      expect(th.classes()).not.toContain("border-r");
    }
  });

  it("默认形态：分页条 wrapper 无 border-t（分隔线由 table 底线/外框承担）", () => {
    const { wrapper } = makeTableRender();
    const pagination = wrapper.element.lastElementChild as HTMLElement;
    expect(pagination.className).not.toContain("border-t");
  });

  it('全网格配方 :single-line="false"：非行末 td/th 有列线，行末排除归外框', () => {
    const { wrapper } = makeTableRender({}, { singleLine: false });
    const tr = dataRows(wrapper)[0]!;
    const tds = tr.findAll("td");
    expect(tds[0]!.classes()).toContain("border-r");
    expect(tds[tds.length - 1]!.classes()).not.toContain("border-r");
    const ths = wrapper.findAll("thead th");
    expect(ths[0]!.classes()).toContain("border-r");
    expect(ths[ths.length - 1]!.classes()).not.toContain("border-r");
  });

  it('主回退 :bordered="false"：无外框、table 挂 border-b（底线新主）', () => {
    const { wrapper } = makeTableRender({}, { bordered: false });
    const table = wrapper.find("table").classes();
    expect(table).not.toContain("border");
    expect(table).toContain("border-b");
    expect(table).toContain("border-border");
  });

  it(':bordered="false" :bottom-bordered="false"：外框与底线全关（无分页旧观感）', () => {
    const { wrapper } = makeTableRender({}, { bordered: false, bottomBordered: false });
    const table = wrapper.find("table").classes();
    expect(table).not.toContain("border");
    expect(table).not.toContain("border-b");
    // 行线不受底线开关影响
    expect(dataRows(wrapper)[0]!.find("td").classes()).toContain("border-b");
  });

  it("single-column：td 行线关闭，表头底线保留（可读性硬底线）", () => {
    const { wrapper } = makeTableRender({}, { singleColumn: true });
    const tr = dataRows(wrapper)[0]!;
    for (const td of tr.findAll("td")) {
      expect(td.classes()).not.toContain("border-b");
    }
    expect(wrapper.find("thead th").classes()).toContain("border-b");
  });
});

describe("TableRender 边框正交模型：sticky 交界与列线让位", () => {
  it("列线关闭（默认）：左 fixed 交界 border-r、右 fixed 交界 border-l 在（现状回归锁）", () => {
    const { wrapper } = makeTableRenderWith(fixedColumns());
    const tds = dataRows(wrapper)[0]!.findAll("td");
    expect(tds[0]!.classes()).toContain("border-r");
    expect(tds[tds.length - 1]!.classes()).toContain("border-l");
  });

  it("列线开启（single-line=false）：交界边框让位统一列线——右 fixed 不再输出 border-l，左 fixed 由列线补 border-r", () => {
    const { wrapper } = makeTableRenderWith(fixedColumns(), {}, { singleLine: false });
    const tds = dataRows(wrapper)[0]!.findAll("td");
    // 左 fixed（非行末）：border-r 来自统一列线（stickyClass 已抑制）
    expect(tds[0]!.classes()).toContain("border-r");
    // 右 fixed（行末）：border-l 被抑制，左边界由前一格的 border-r 承担
    expect(tds[tds.length - 1]!.classes()).not.toContain("border-l");
  });
});

describe("TableRender 边框正交模型：条纹", () => {
  it("striped：奇数行模型索引 tr 挂 bg-muted/30，偶数行不挂", () => {
    const { wrapper } = makeTableRender({}, { striped: true });
    const rows = dataRows(wrapper);
    expect(rows.length).toBeGreaterThan(2);
    expect(rows[0]!.classes()).not.toContain("bg-muted/30");
    expect(rows[1]!.classes()).toContain("bg-muted/30");
    expect(rows[2]!.classes()).not.toContain("bg-muted/30");
  });

  it("sticky 条纹正交性（列线关闭 + striped）：奇数行 sticky td 换 color-mix 固色且交界 border-r 保留", () => {
    const { wrapper } = makeTableRenderWith(
      [{ key: "name", title: "姓名", fixed: "left", width: 100 }],
      {},
      { striped: true },
    );
    const rows = dataRows(wrapper);
    const evenTd = rows[0]!.findAll("td")[0]!;
    const oddTd = rows[1]!.findAll("td")[0]!;
    expect(evenTd.classes()).toContain("bg-background");
    expect(evenTd.classes()).not.toContain("color-mix");
    expect(oddTd.classes()).toContain(
      "bg-[color-mix(in_oklab,var(--color-muted)_30%,var(--color-background))]",
    );
    // 正交性锁：条纹不影响交界边框输出（列线关闭时 edge border 仍在）
    expect(oddTd.classes()).toContain("border-r");
  });
});

describe("TableRender 边框正交模型：骨架/空态/多行表头", () => {
  it("骨架行跟随行线开关（默认 rowLinesOn）：骨架 td 有行线", () => {
    const { wrapper } = makeTableRender({}, { loading: true });
    const skeleton = wrapper.find("tr[data-skeleton]");
    expect(skeleton.exists()).toBe(true);
    for (const td of skeleton.findAll("td")) {
      expect(td.classes()).toContain("border-b");
    }
  });

  it("空态 colspan 单格参与外框（table 层闭合），自身无线", () => {
    const { wrapper } = makeTableRender({ data: [] });
    expect(wrapper.find("[data-empty]").exists()).toBe(true);
    expect(wrapper.find("table").classes()).toContain("border");
    expect(wrapper.find("[data-empty] td").classes()).not.toContain("border-b");
  });

  it("多行表头：逐层 th 底线在（收敛回归锁）；分组列线结构性恒画，行末分组排除", () => {
    const { wrapper } = makeTableRenderWith(groupColumns());
    const rows = wrapper.findAll("thead tr");
    expect(rows.length).toBe(2);
    const groupThs = rows[0]!.findAll("th");
    // 分组行末（g2）排除，右缘归外框；g1 为结构性分隔
    expect(groupThs[0]!.classes()).toContain("border-r");
    expect(groupThs[1]!.classes()).not.toContain("border-r");
    for (const th of rows[0]!.findAll("th")) expect(th.classes()).toContain("border-b");
    // 叶子行：列线默认关闭
    for (const th of rows[1]!.findAll("th")) {
      expect(th.classes()).toContain("border-b");
      expect(th.classes()).not.toContain("border-r");
    }
  });

  it("多行表头 + 列线开启：叶子 th 非行末有列线，行末排除", () => {
    const { wrapper } = makeTableRenderWith(groupColumns(), {}, { singleLine: false });
    const leafThs = wrapper.findAll("thead tr")[1]!.findAll("th");
    expect(leafThs.length).toBe(4);
    for (let i = 0; i < 3; i++) expect(leafThs[i]!.classes()).toContain("border-r");
    expect(leafThs[3]!.classes()).not.toContain("border-r");
  });
});

describe("TableRender 边框正交模型：virtual 协同", () => {
  it("virtual + height：pad 行 td 保持 border-0（#8 回归锁延续）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({}, { virtual: true, height: 200 });
    expect(warn).not.toHaveBeenCalled();
    // happy-dom 无布局时虚拟窗口可能为空（仅剩 pad 行）；数据行 td 类路径由其余用例覆盖
    expect(wrapper.find("tbody tr[data-virtual-pad] td").classes()).toContain("border-0");
  });
});
