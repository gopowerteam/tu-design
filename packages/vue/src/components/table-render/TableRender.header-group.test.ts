import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import type { TableColumnNode, TableRenderDefinition } from "./types";
import TableRender from "./TableRender.vue";

// 表头分组（多级表头，R34–R39）测试：矩阵 span、可见树剪枝、分组显隐三态、
// 分组 sticky、多行 sticky top 兜底、扁平列向后兼容。

interface User {
  id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
}

const USERS: User[] = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 30 - i,
  phone: `1380000000${i}`,
  email: `u${i}@test.dev`,
}));

/** 2 级表头：基本信息（name/age）+ 联系方式（phone/email） */
function groupedColumns(): TableColumnNode<User>[] {
  return [
    {
      title: "基本信息",
      children: [
        { key: "name", title: "姓名", width: 120 },
        { key: "age", title: "年龄", width: 80, sortable: true },
      ],
    },
    {
      title: "联系方式",
      children: [
        { key: "phone", title: "手机", width: 140 },
        { key: "email", title: "邮箱" },
      ],
    },
  ];
}

/** Host 在 setup 内 defineTable（TanStack 约束）并渲染 TableRender */
function makeTableRender(
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
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def! };
}

/** 表头行矩阵：每行的 th 文本（含 colspan 展开次数由 DOM 承担，这里取文本序列） */
const popoverContent = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

/** 单元格内联样式（sticky 断言用） */
function cellStyle(el: { element: Element }): CSSStyleDeclaration {
  return (el.element as HTMLElement).style;
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
});

describe("TableRender 表头分组（R34–R39）", () => {
  it("2 级表头：生成两行，分组格 colSpan=2，叶子行分布正确（R34/R35）", async () => {
    const { wrapper } = makeTableRender(groupedColumns());
    await flushPromises();

    const rows = wrapper.findAll("thead tr");
    expect(rows.length).toBe(2);

    // 第一行：仅分组格
    const groupCells = rows[0]!.findAll("th");
    expect(groupCells.map((th) => th.text())).toEqual(["基本信息", "联系方式"]);
    expect(groupCells[0]!.attributes("colspan")).toBe("2");
    expect(groupCells[1]!.attributes("colspan")).toBe("2");
    expect(groupCells[0]!.attributes("scope")).toBe("colgroup");

    // 第二行：四个叶子，rowSpan 不输出（已在底行）
    const leafCells = rows[1]!.findAll("th");
    expect(leafCells.map((th) => th.text())).toEqual(["姓名", "年龄", "手机", "邮箱"]);
    expect(leafCells[0]!.attributes("rowspan")).toBeUndefined();
    expect(leafCells[0]!.attributes("scope")).toBe("col");
    wrapper.unmount();
  });

  it("3 级表头：顶层 colSpan=2，中层 colSpan=2，叶子下沉 rowSpan 正确（R35）", async () => {
    const { wrapper } = makeTableRender([
      {
        title: "基本信息",
        children: [
          {
            title: "用户信息",
            children: [
              { key: "name", title: "姓名" },
              { key: "age", title: "年龄" },
            ],
          },
        ],
      },
      { key: "phone", title: "手机" },
    ]);
    await flushPromises();

    const rows = wrapper.findAll("thead tr");
    // maxDepth = 3：手机为顶层叶子，应占 rowSpan = 3 - 0 = 3
    expect(rows.length).toBe(3);
    const topRow = rows[0]!.findAll("th");
    expect(topRow.map((th) => th.text())).toEqual(["基本信息", "手机"]);
    expect(topRow[0]!.attributes("colspan")).toBe("2");
    expect(topRow[1]!.attributes("rowspan")).toBe("3");

    // 中层分组 colSpan=2（可见叶子 2）
    const midRow = rows[1]!.findAll("th");
    expect(midRow.map((th) => th.text())).toEqual(["用户信息"]);
    expect(midRow[0]!.attributes("colspan")).toBe("2");

    // 底行为叶子
    expect(rows[2]!.findAll("th").map((th) => th.text())).toEqual(["姓名", "年龄"]);
    wrapper.unmount();
  });

  it("分组跨列数随可见集收缩；全隐分组整支剔除（R23/R35）", async () => {
    const { wrapper, def } = makeTableRender(groupedColumns());
    await flushPromises();
    def().setVisibleKeys(["name", "age", "phone"]);
    await flushPromises();

    const rows = wrapper.findAll("thead tr");
    const groupCells = rows[0]!.findAll("th");
    // 联系方式组可见叶子仅 phone → colSpan=1；仍在（未全隐）
    expect(groupCells.map((th) => th.text())).toEqual(["基本信息", "联系方式"]);
    expect(groupCells[1]!.attributes("colspan")).toBeUndefined();

    // 隐藏 phone → 联系方式组可见叶子 0 → 整支剔除（仅剩基本信息一组，colSpan=2）
    def().setVisibleKeys(["name", "age"]);
    await flushPromises();
    const remaining = wrapper.findAll("thead tr")[0]!.findAll("th");
    expect(remaining.map((th) => th.text())).toEqual(["基本信息"]);
    expect(remaining[0]!.attributes("colspan")).toBe("2");
    wrapper.unmount();
  });

  it("可见树驱动 maxDepth：深分支隐藏后表头行数收缩，无空白行（I2）", async () => {
    const { wrapper, def } = makeTableRender([
      {
        title: "外层",
        children: [{ title: "内层", children: [{ key: "name", title: "姓名" }] }],
      },
      { key: "age", title: "年龄" },
    ]);
    await flushPromises();
    expect(wrapper.findAll("thead tr").length).toBe(3);

    def().setVisibleKeys(["age"]);
    await flushPromises();
    // 深层分支剔除 → 仅剩单级
    expect(wrapper.findAll("thead tr").length).toBe(1);
    expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["年龄"]);
    wrapper.unmount();
  });

  it("扁平列向后兼容：单行表头，不输出 colspan/rowspan（A3）", async () => {
    const { wrapper } = makeTableRender([
      { key: "name", title: "姓名", width: 120 },
      { key: "age", title: "年龄", sortable: true },
    ]);
    await flushPromises();
    const rows = wrapper.findAll("thead tr");
    expect(rows.length).toBe(1);
    const ths = rows[0]!.findAll("th");
    expect(ths.map((th) => th.text())).toEqual(["姓名", "年龄"]);
    for (const th of ths) {
      expect(th.attributes("colspan")).toBeUndefined();
      expect(th.attributes("rowspan")).toBeUndefined();
      expect(th.attributes("scope")).toBe("col");
      // 单级表头不追加分组视觉类（DOM 零变化）
      expect(th.classes()).not.toContain("border-r");
    }
    wrapper.unmount();
  });

  it("多行 sticky：theadSticky 下逐行累积 top 偏移（兜底 h-10=40px，R38）", async () => {
    const { wrapper } = makeTableRender(groupedColumns(), {}, { fillHeight: true });
    await flushPromises();
    const rows = wrapper.findAll("thead tr");
    const first = (rows[0]!.element as HTMLElement).style.top;
    const second = (rows[1]!.element as HTMLElement).style.top;
    expect(first).toBe("0px");
    expect(second).toBe("40px");
    wrapper.unmount();
  });

  it("列设置面板树形：分组行带 data-column-group，叶子行保留 data-column-key（R37）", async () => {
    const { wrapper } = makeTableRender(groupedColumns());
    await flushPromises();
    await wrapper.find('button[aria-label="列设置"]').trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    const content = popoverContent()!;
    expect(content.querySelectorAll("[data-column-key]").length).toBe(4);
    expect(
      Array.from(content.querySelectorAll("[data-column-group]")).map((el) =>
        el.textContent?.trim(),
      ),
    ).toEqual(["基本信息", "联系方式"]);
    wrapper.unmount();
  });

  it("分组三态与批量显隐：点击分组行隐藏整组；全隐时钳制保留最后一枚叶子（A5/R20/R37）", async () => {
    const { wrapper, def } = makeTableRender(groupedColumns());
    await flushPromises();
    await wrapper.find('button[aria-label="列设置"]').trigger("click");
    await flushPromises();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    // 点击「基本信息」分组行 → 整组隐藏
    const groupItem = popoverContent()!.querySelector<HTMLElement>('[data-column-group="0"]');
    groupItem!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    expect(def().visibleKeys.value).toEqual(["phone", "email"]);

    // 再点击「联系方式」分组行 → 将清空可见集 → 钳制保留最后一枚叶子
    const group2 = popoverContent()!.querySelector<HTMLElement>('[data-column-group="1"]');
    group2!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await flushPromises();
    expect(def().visibleKeys.value).toEqual(["email"]);
    wrapper.unmount();
  });

  it("分组 × 固定列：组内同侧连续固定 → 分组格 sticky；混合方向降级普通格（R36）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // 同侧连续：左固定组
    const { wrapper } = makeTableRender(
      [
        {
          title: "联系方式",
          children: [
            { key: "phone", title: "手机", width: 140, fixed: "left" },
            { key: "email", title: "邮箱", width: 140, fixed: "left" },
          ],
        },
        { key: "name", title: "姓名" },
      ],
      {},
      { fillHeight: true },
    );
    await flushPromises();
    const leftGroup = wrapper.findAll("thead tr")[0]!.findAll("th")[0]!;
    expect(cellStyle(leftGroup).position).toBe("sticky");
    expect(cellStyle(leftGroup).left).toBe("0px");
    wrapper.unmount();

    // 混合方向：降级普通格 + 警告
    const mixed = makeTableRender([
      {
        title: "联系方式",
        children: [
          { key: "phone", title: "手机", width: 140, fixed: "left" },
          { key: "email", title: "邮箱", width: 140, fixed: "right" },
        ],
      },
    ]);
    await flushPromises();
    const mixedGroup = mixed.wrapper.findAll("thead tr")[0]!.findAll("th")[0]!;
    expect(cellStyle(mixedGroup).position).not.toBe("sticky");
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("内固定方向混合，已降级为普通表头格"),
    );
    mixed.wrapper.unmount();
  });

  it("DEV 校验：分组误配 sortable 触发一次性警告（R39）", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender([
      {
        title: "分组A",
        sortable: true,
        children: [{ key: "name", title: "姓名" }],
      },
    ] as unknown as TableColumnNode<User>[]);
    await flushPromises();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("分组「分组A」不支持 sortable"));
    wrapper.unmount();
  });
});
