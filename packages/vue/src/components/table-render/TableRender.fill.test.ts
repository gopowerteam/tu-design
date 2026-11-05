import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { PAGE_TABLE_FILL_KEY } from "./constants";
import { defineTable } from "./define-table";
import type { TableColumnOptions, TableRenderDefinition } from "./types";
import TableRender from "./TableRender.vue";

// 填充模式（fillHeight）测试：断言 DOM 类名与 inline style 的模式化差异；
// virtual 相关用例走真实 @tanstack/vue-virtual（happy-dom 缺 ResizeObserver 时
// virtual-core 静默跳过窗口计算，不影响类名/警告断言，见主测试文件注释）。

interface User {
  id: number;
  name: string;
  age: number;
}

// 25 条数据：默认分页下 >10 条，保证内置分页条渲染（shrink-0 断言依赖）
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

/** Host 在 setup 内 defineTable（TanStack 约束）并渲染 TableRender；
 * provideValue 非空时经全局 provide 注入 PAGE_TABLE_FILL_KEY */
function makeTableRender(
  config: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
  provideValue?: boolean,
) {
  const box: { def?: TableRenderDefinition<User> } = {};
  const Host = defineComponent({
    setup() {
      box.def = defineTable<User>({ columns: baseColumns(), data: USERS, ...config });
      return () => h(TableRender, { rowKey: "id", definition: box.def, ...props });
    },
  });
  const wrapper = mount(Host, {
    attachTo: document.body,
    global:
      provideValue === undefined ? undefined : { provide: { [PAGE_TABLE_FILL_KEY]: provideValue } },
  });
  return { wrapper, def: () => box.def! };
}

/** 滚动区元素（滚动 div 为 table 的直接父节点） */
function scrollEl(wrapper: ReturnType<typeof mount>): HTMLElement {
  return wrapper.find("table").element.parentElement as HTMLElement;
}

/** 分页条元素（TableRender 根容器的末位子元素；border-t 由 TableRender 显式补，作定位锚点） */
function paginationEl(wrapper: ReturnType<typeof mount>): HTMLElement {
  return wrapper.element.lastElementChild as HTMLElement;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TableRender fillHeight 默认模式（零回归）", () => {
  it("未传 fill、无 provide：根容器无 flex/h-full，滚动区无纵向滚动类", () => {
    const { wrapper } = makeTableRender();
    expect(wrapper.element.className).not.toContain("h-full");
    expect(wrapper.element.className).not.toContain("flex");
    expect(scrollEl(wrapper).className).not.toContain("overflow-y-auto");
    expect(scrollEl(wrapper).className).not.toContain("flex-1");
    expect(scrollEl(wrapper).style.height).toBe("");
  });

  it("th 无 sticky 类；thead 保留行级 border-b；table 保持 collapse（无分离边框类）", () => {
    const { wrapper } = makeTableRender();
    expect(wrapper.find("thead th").classes()).not.toContain("sticky");
    expect(wrapper.find("thead th").classes()).not.toContain("top-0");
    expect(wrapper.find("thead").classes().join(" ")).toContain("[&_tr]:border-b");
    expect(wrapper.find("table").classes()).not.toContain("border-separate");
  });

  it("分页条渲染但无 shrink-0", () => {
    const { wrapper } = makeTableRender();
    const pagination = paginationEl(wrapper);
    expect(pagination.className).toContain("border-t");
    expect(pagination.className).not.toContain("shrink-0");
  });
});

describe("TableRender fillHeight 显式 prop", () => {
  it("根容器 flex h-full min-h-0 flex-col；滚动区 flex-1 内滚且无固定 height", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: true });
    const root = wrapper.element.className;
    expect(root).toContain("flex");
    expect(root).toContain("h-full");
    expect(root).toContain("min-h-0");
    expect(root).toContain("flex-col");
    const scroll = scrollEl(wrapper);
    expect(scroll.className).toContain("overflow-x-auto");
    expect(scroll.className).toContain("min-h-0");
    expect(scroll.className).toContain("flex-1");
    expect(scroll.className).toContain("overflow-y-auto");
    expect(scroll.style.height).toBe("");
  });

  it("th sticky 表头类齐备（sticky/top-0/z-20/border-b/bg-background）", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: true });
    const th = wrapper.find("thead th").classes();
    expect(th).toContain("sticky");
    expect(th).toContain("top-0");
    expect(th).toContain("z-20");
    expect(th).toContain("border-b");
    expect(th).toContain("bg-background");
  });

  it("thead 行级 border-b 让位；table 切分离边框防 collapse 下 sticky 边框丢失", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: true });
    expect(wrapper.find("thead").classes().join(" ")).not.toContain("[&_tr]:border-b");
    expect(wrapper.find("table").classes()).toContain("border-separate");
    expect(wrapper.find("table").classes()).toContain("border-spacing-0");
  });

  it("分页条获得 shrink-0 防压缩", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: true });
    const pagination = paginationEl(wrapper);
    expect(pagination.className).toContain("border-t");
    expect(pagination.className).toContain("shrink-0");
  });

  it("fill 与 height 同传：以 fill 优先（滚动区无固定 height，交给 flex 分配）", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: true, height: 300 });
    expect(scrollEl(wrapper).style.height).toBe("");
    expect(scrollEl(wrapper).className).toContain("flex-1");
  });

  it("空态 colspan 与 sticky 表头共存", () => {
    const { wrapper } = makeTableRender({ data: [] }, { fillHeight: true });
    expect(wrapper.find("[data-empty]").exists()).toBe(true);
    expect(wrapper.find("thead th").classes()).toContain("sticky");
  });
});

describe("TableRender fillHeight 布局 provide", () => {
  it("provide key=true 且未传 prop：fill 生效", () => {
    const { wrapper } = makeTableRender({}, {}, true);
    expect(wrapper.element.className).toContain("h-full");
    expect(wrapper.find("thead th").classes()).toContain("sticky");
    expect(wrapper.find("table").classes()).toContain("border-separate");
  });

  it("显式 :fill-height=false 覆盖 provide：回到普通模式", () => {
    const { wrapper } = makeTableRender({}, { fillHeight: false }, true);
    expect(wrapper.element.className).not.toContain("h-full");
    expect(wrapper.find("thead th").classes()).not.toContain("sticky");
    expect(wrapper.find("table").classes()).not.toContain("border-separate");
  });
});

describe("TableRender fillHeight × virtual 交互", () => {
  it("virtual 无 height 且无 fill：维持警告并降级普通渲染（无 sticky 表头）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({}, { virtual: true });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("virtual 需要配置 height"));
    expect(wrapper.find("thead th").classes()).not.toContain("sticky");
    expect(wrapper.findAll("[data-virtual-pad]").length).toBe(0);
  });

  it("virtual 无 height + fill：不警告、不降级（fill 自带真实滚动盒）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({}, { virtual: true, fillHeight: true });
    expect(warn).not.toHaveBeenCalled();
    expect(wrapper.find("thead th").classes()).toContain("sticky");
    expect(wrapper.findAll("[data-virtual-pad]").length).toBeGreaterThan(0);
  });

  it("virtual + height（无 fill）：既有行为保留——固定 height + sticky 表头（存量缺陷修复）", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { wrapper } = makeTableRender({}, { virtual: true, height: 200 });
    expect(warn).not.toHaveBeenCalled();
    expect(scrollEl(wrapper).style.height).toBe("200px");
    expect(wrapper.find("thead th").classes()).toContain("sticky");
  });
});
