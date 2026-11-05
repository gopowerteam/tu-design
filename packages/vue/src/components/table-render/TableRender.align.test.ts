import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vite-plus/test";
import { defineTable } from "./define-table";
import type { TableColumnOptions, TableRenderDefinition } from "./types";
import TableRender from "./TableRender.vue";

// 对齐测试：业务列（表头/表体/骨架行）未配 align 时默认居中，显式 align 覆盖默认；
// 选择列恒居中（text-center）；r.button 按钮组为 inline-flex，随单元格 align 对齐。

interface User {
  id: number;
  name: string;
  age: number;
}

const USERS: User[] = [
  { id: 1, name: "用户1", age: 30 },
  { id: 2, name: "用户2", age: 28 },
];

/** Host 在 setup 内 defineTable（TanStack 约束）并渲染 TableRender */
function makeTableRender(
  columns: TableColumnOptions<User>[],
  config: Record<string, unknown> = {},
) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({ columns, data: USERS, ...config });
      return () => h(TableRender, { rowKey: "id", definition: box.def });
    },
  });
  return mount(Host, { attachTo: document.body });
}

/** 单元格内联样式（DOMWrapper.element 是 Element，需收窄到 HTMLElement） */
function cellStyle(el: { element: Element }): CSSStyleDeclaration {
  return (el.element as HTMLElement).style;
}

describe("TableRender 对齐：业务列默认 center", () => {
  it("未配置 align：表头 th 与表体 td 默认居中", () => {
    const wrapper = makeTableRender([
      { key: "name", title: "姓名" },
      { key: "age", title: "年龄" },
    ]);
    const th = wrapper.findAll("thead th")[0]!;
    const td = wrapper.find("tbody tr td");
    expect(cellStyle(th).textAlign).toBe("center");
    expect(cellStyle(td).textAlign).toBe("center");
  });

  it("显式 align: left / right 不被默认值覆盖", () => {
    const wrapper = makeTableRender([
      { key: "name", title: "姓名", align: "left" },
      { key: "age", title: "年龄", align: "right" },
    ]);
    const ths = wrapper.findAll("thead th");
    const tds = wrapper.findAll("tbody tr")[0]!.findAll("td");
    expect(cellStyle(ths[0]!).textAlign).toBe("left");
    expect(cellStyle(tds[0]!).textAlign).toBe("left");
    expect(cellStyle(ths[1]!).textAlign).toBe("right");
    expect(cellStyle(tds[1]!).textAlign).toBe("right");
  });

  it("加载骨架行 td 默认居中（外部 loading 直挂 TableRender）", () => {
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: [{ key: "name", title: "姓名" }], data: [], loading: true },
      attachTo: document.body,
    });
    const td = wrapper.find("tbody tr[data-skeleton] td");
    expect(cellStyle(td).textAlign).toBe("center");
  });

  it("选择列：表头与表体恒居中（text-center）", () => {
    const wrapper = makeTableRender([{ key: "name", title: "姓名" }], { rowSelection: "checkbox" });
    expect(wrapper.find("thead th").classes()).toContain("text-center");
    expect(wrapper.find("tbody td").classes()).toContain("text-center");
  });

  it("r.button 操作列：默认居中且按钮组为 inline-flex（随单元格 align）", () => {
    const wrapper = makeTableRender([
      { key: "ops", title: "操作", render: (r) => r.button([{ text: "编辑" }, "删除"]) },
    ]);
    const td = wrapper.find("tbody td");
    expect(cellStyle(td).textAlign).toBe("center");
    expect(td.find("div").classes()).toContain("inline-flex");
  });
});
