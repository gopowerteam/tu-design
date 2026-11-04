import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { defineTable } from "./define-table";
import TablePagination from "./TablePagination.vue";
import type { TableRenderDefinition } from "./types";

interface User {
  id: number;
  name: string;
}

const USERS: User[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `用户${i + 1}` }));

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Host 在 setup 内 defineTable（TanStack 约束）并渲染 TablePagination（definition 模式） */
function makePager(props: Record<string, unknown> = {}, config: { total?: number } = {}) {
  const onLoad = vi.fn(({ update }: any) => update(USERS.slice(0, 5), config.total ?? 100));
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({
        columns: [{ key: "name", title: "姓名" }],
        onLoad,
        rowKey: "id",
      });
      return () => h(TablePagination, { definition: box.def, ...props });
    },
  });
  const wrapper = mount(Host, { attachTo: document.body });
  return { wrapper, def: () => box.def!, onLoad };
}

/** 手动 props 模式（不经 defineTable） */
function makeManualPager(props: Record<string, unknown>) {
  return mount(TablePagination, {
    props: { pageIndex: 1, pageSize: 10, pageSizeOpts: [10, 20, 50], total: 100, ...props },
    attachTo: document.body,
  });
}

function pageButtons(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll("button");
}

describe("TablePagination definition 模式（R29）", () => {
  it("渲染 definition.page 数据；点页码 → setPageIndex + emit update:pageIndex", async () => {
    const { wrapper, def } = makePager();
    await flushPromises();

    expect(wrapper.text()).toContain("共 100 条");
    const page2 = pageButtons(wrapper).find((b) => b.text() === "2");
    expect(page2).toBeTruthy();
    await page2!.trigger("click");

    expect(def().page.pageIndex).toBe(2);
    expect(wrapper.findComponent(TablePagination).emitted("update:pageIndex")?.at(-1)).toEqual([2]);
    wrapper.unmount();
  });

  it("R13：definition 模式单页（total ≤ pageSize）自隐藏", async () => {
    const { wrapper } = makePager({}, { total: 5 });
    await flushPromises();

    expect(wrapper.text()).not.toContain("共 5 条");
    expect(wrapper.find("nav").exists()).toBe(false);
    wrapper.unmount();
  });

  it("definition + 手动分页 props 同传 → 以 definition 为准 + DEV 警告（R29/R4）", async () => {
    const { wrapper } = makePager({ pageIndex: 99, pageSize: 7, total: 3 });
    await flushPromises();

    expect(wrapper.text()).toContain("共 100 条");
    expect(wrapper.text()).not.toContain("共 3 条");
    expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
      expect.stringContaining("已按 definition 渲染"),
    );
    wrapper.unmount();
  });

  it("缺 definition 且缺关键手动 props → DEV 警告 + 不渲染", () => {
    const wrapper = mount(TablePagination, { props: { total: 100 }, attachTo: document.body });

    expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
      expect.stringContaining("缺少 definition"),
    );
    expect(wrapper.text()).toBe("");
    wrapper.unmount();
  });
});

describe("TablePagination 手动模式与形态 props", () => {
  it("手动模式单页仍渲染（可见性自理）", () => {
    const wrapper = makeManualPager({ total: 5 });

    expect(wrapper.text()).toContain("共 5 条");
    wrapper.unmount();
  });

  it("showTotal: false → 无「共 N 条」，页码靠右保留", () => {
    const wrapper = makeManualPager({ showTotal: false });

    expect(wrapper.text()).not.toContain("共 100 条");
    expect(wrapper.find("nav").exists()).toBe(true);
    wrapper.unmount();
  });

  it("showSizeSelect 缺省无 select；true 渲染且 change → emit update:pageSize", async () => {
    const none = makeManualPager({});
    expect(none.find("select").exists()).toBe(false);
    none.unmount();

    const shown = makeManualPager({ showSizeSelect: true });
    expect(shown.find("select").exists()).toBe(true);
    await shown.find("select").setValue("20");
    expect(shown.emitted("update:pageSize")?.at(-1)).toEqual([20]);
    shown.unmount();
  });

  it("showSizeSelect=true + definition：change 走 setPageSize", async () => {
    const { wrapper, def } = makePager({ showSizeSelect: true });
    await flushPromises();

    await wrapper.find("select").setValue("50");
    expect(def().page.pageSize).toBe(50);
    expect(wrapper.findComponent(TablePagination).emitted("update:pageSize")?.at(-1)).toEqual([50]);
    wrapper.unmount();
  });

  it('navMode: "icon" → chevron 图标（aria-label）无文字；缺省保持文字', () => {
    const icon = makeManualPager({ navMode: "icon" });
    expect(icon.text()).not.toContain("上一页");
    expect(icon.find('[aria-label="上一页"]').exists()).toBe(true);
    expect(icon.find('[aria-label="下一页"]').exists()).toBe(true);
    icon.unmount();

    const text = makeManualPager({});
    expect(text.text()).toContain("上一页");
    expect(text.text()).toContain("下一页");
    text.unmount();
  });
});
