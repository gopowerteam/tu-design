import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import ColumnSettingsPanel from "./ColumnSettingsPanel.vue";
import { flattenColumns } from "./columns";
import type { TableColumnNode } from "./types";

// Phase 2：列设置面板（纯内容组件）能力 characterization：
// 搜索门槛 / 祖先保留 / 折叠 / 计数 / 折叠不写 visibleKeys / data-hidden / 重置门槛 / 全选态。

const COLUMNS = flattenColumns([
  { key: "name", title: "姓名" },
  { key: "age", title: "年龄" },
  { key: "phone", title: "手机" },
  { key: "email", title: "邮箱" },
  { key: "dept", title: "部门" },
  { key: "city", title: "城市" },
]);

/** 2 级表头：基本信息（name/age）+ 其余扁平叶子（共 6 叶） */
function groupedTree(): TableColumnNode[] {
  return [
    {
      title: "基本信息",
      children: [
        { key: "name", title: "姓名" },
        { key: "age", title: "年龄" },
      ],
    },
    { key: "phone", title: "手机" },
    { key: "email", title: "邮箱" },
    { key: "dept", title: "部门" },
    { key: "city", title: "城市" },
  ];
}

/** 扁平 2 列（totalCount < 6，搜索区不渲染） */
function smallTree(): TableColumnNode[] {
  return [
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄" },
  ];
}

function mountPanel(
  tree: TableColumnNode[],
  visibleKeys: string[],
  defaults?: string[],
  extra: Record<string, unknown> = {},
) {
  const wrapper = mount(ColumnSettingsPanel, {
    props: {
      columns: flattenColumns(tree),
      columnTree: tree,
      visibleKeys,
      defaultVisibleKeys: defaults,
      "onUpdate:visible-keys": (keys: string[]) => wrapper.setProps({ visibleKeys: keys }),
      ...extra,
    },
    attachTo: document.body,
  });
  return wrapper;
}

const keysOf = (wrapper: ReturnType<typeof mount>) =>
  wrapper.findAll("[data-column-key]").map((el) => el.attributes("data-column-key"));

describe("ColumnSettingsPanel 列设置面板", () => {
  it("搜索仅 totalCount>=6 渲染", () => {
    const small = mountPanel(smallTree(), ["name", "age"]);
    expect(small.find("[data-column-search]").exists()).toBe(false);
    small.unmount();

    const big = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
    );
    expect(big.find("[data-column-search]").exists()).toBe(true);
    big.unmount();
  });

  it("搜索命中叶子保留祖先分组", async () => {
    const wrapper = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
    );
    await wrapper.find("[data-column-search]").setValue("年龄");
    expect(keysOf(wrapper)).toEqual(["age"]);
    expect(wrapper.find('[data-column-group="0"]').exists()).toBe(true); // 祖先分组保留
    wrapper.unmount();
  });

  it("分组折叠/展开且折叠不写 visibleKeys", async () => {
    const onUpdate = vi.fn();
    const wrapper = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
      undefined,
      {
        "onUpdate:visible-keys": onUpdate,
      },
    );
    expect(keysOf(wrapper)).toContain("name");
    await wrapper.find("[data-collapse-toggle]").trigger("click");
    expect(keysOf(wrapper)).not.toContain("name"); // 子树折叠隐藏
    expect(wrapper.find('[data-column-group="0"]').attributes("data-collapsed")).toBeDefined();
    expect(onUpdate).not.toHaveBeenCalled(); // 折叠是局部状态
    await wrapper.find("[data-collapse-toggle]").trigger("click");
    expect(keysOf(wrapper)).toContain("name");
    wrapper.unmount();
  });

  it("计数随显隐更新", async () => {
    const wrapper = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
    );
    expect(wrapper.find("[data-column-count]").text()).toBe("已显示 6/6");
    await wrapper.find('[data-column-key="phone"]').trigger("click");
    expect(wrapper.find("[data-column-count]").text()).toBe("已显示 5/6");
    wrapper.unmount();
  });

  it("隐藏列文案弱化 data-hidden", () => {
    const wrapper = mountPanel(groupedTree(), ["name", "age", "phone", "email", "dept"]);
    expect(wrapper.find('[data-column-key="city"]').attributes("data-hidden")).toBeDefined();
    expect(wrapper.find('[data-column-key="name"]').attributes("data-hidden")).toBeUndefined();
    wrapper.unmount();
  });

  it("highlightKey 命中叶子标记 data-highlight", () => {
    const wrapper = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
      undefined,
      {
        highlightKey: "phone",
      },
    );
    expect(wrapper.find('[data-column-key="phone"]').attributes("data-highlight")).toBeDefined();
    expect(wrapper.find('[data-column-key="name"]').attributes("data-highlight")).toBeUndefined();
    wrapper.unmount();
  });

  it("重置仅 hasDefault 时渲染；全选已全选时 disabled", async () => {
    const noDefault = mountPanel(
      groupedTree(),
      COLUMNS.map((c) => c.key),
    );
    expect(noDefault.findAll("button").some((b) => b.text() === "重置")).toBe(false);
    expect(
      noDefault
        .findAll("button")
        .find((b) => b.text() === "全选")!
        .attributes("disabled"),
    ).toBeDefined();
    noDefault.unmount();

    const withDefault = mountPanel(groupedTree(), ["name"], ["name", "age"]);
    const reset = withDefault.findAll("button").find((b) => b.text() === "重置")!;
    expect(reset.exists()).toBe(true);
    withDefault.unmount();
  });
});
