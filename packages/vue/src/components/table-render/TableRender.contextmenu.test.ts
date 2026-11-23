import { flushPromises, mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vite-plus/test";
import { defineComponent, h } from "vue";
import { defineForm } from "../form-render";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";

// Phase 0 characterization：行右键协议现状。
// 行监听挂在 <tr>（TableBodyRow.vue:89），单元格不单独拦截；
// 业务 preventDefault 由宿主 listener 自己调用，引擎 emit 前后不改 defaultPrevented
//（TableRender.vue onRowContextmenu 仅透传 record/index/event）。

interface User {
  id: number;
  name: string;
  age: number;
}

const USERS: User[] = Array.from({ length: 3 }, (_, i) => ({
  id: i + 1,
  name: `用户${i + 1}`,
  age: 30 - i,
}));

function baseColumns() {
  return [
    { key: "name", title: "姓名" },
    { key: "age", title: "年龄" },
  ];
}

function mountWith(listener: (record: User, index: number, event: MouseEvent) => void) {
  const wrapper = mount(TableRender, {
    props: {
      rowKey: "id",
      columns: baseColumns(),
      data: USERS,
      onRowContextmenu: listener,
    },
    attachTo: document.body,
  });
  return wrapper;
}

describe("TableRender 行右键（contextmenu）协议", () => {
  it("行右键 emit (record,index,event) 且不改 defaultPrevented", async () => {
    const spy = vi.fn();
    const wrapper = mountWith(spy);
    await flushPromises();

    const row = wrapper.findAll("tbody tr")[0]!;
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    row.element.dispatchEvent(event);
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual(USERS[0]);
    expect(spy.mock.calls[0]![1]).toBe(0);
    expect(spy.mock.calls[0]![2]).toBe(event);
    expect(event.defaultPrevented).toBe(false);
    wrapper.unmount();
  });

  it("业务 preventDefault 后 defaultPrevented=true", async () => {
    const spy = vi.fn((_record: User, _index: number, event: MouseEvent) => {
      event.preventDefault();
    });
    const wrapper = mountWith(spy);
    await flushPromises();

    const row = wrapper.findAll("tbody tr")[0]!;
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    row.element.dispatchEvent(event);
    await flushPromises();

    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0]![2] as MouseEvent).defaultPrevented).toBe(true);
    expect(event.defaultPrevented).toBe(true);
    wrapper.unmount();
  });

  it("单元格右键同时触发行右键（冒泡现状）", async () => {
    const spy = vi.fn();
    const wrapper = mountWith(spy);
    await flushPromises();

    const cell = wrapper.findAll("tbody tr")[0]!.findAll("td")[0]!;
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    cell.element.dispatchEvent(event);
    await flushPromises();

    // 单元格无独立 contextmenu 处理，事件冒泡到 tr 后触发行右键（与 row-click 冒泡并存同款现状）
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual(USERS[0]);
    expect(spy.mock.calls[0]![1]).toBe(0);
    expect((spy.mock.calls[0]![2] as MouseEvent).target).toBe(cell.element);
    wrapper.unmount();
  });
});

// ---- Phase 4：右键命令菜单（contextMenu 显式开启） --------------------------------

const menuRoot = () => document.querySelector<HTMLElement>("[data-table-menu][data-state='open']");
const menuItemEls = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-table-menu] [role="menuitem"]'));

/** 在元素上派发 contextmenu（可指定坐标） */
function fireContextMenu(el: Element, init: MouseEventInit = {}) {
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
}

/** 点击菜单项（Ark 菜单以 click 触发 select） */
async function clickMenuItem(label: string) {
  const item = menuItemEls().find((el) => el.textContent?.trim() === label);
  if (!item) throw new Error(`菜单项不存在：${label}`);
  item.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  await flushPromises();
}

describe("TableRender 右键命令菜单", () => {
  it("默认不挂根节点 handler（右键不打开菜单）", async () => {
    const wrapper = mountWith(vi.fn());
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await flushPromises();
    expect(menuRoot()).toBeNull();
    wrapper.unmount();
  });

  it("contextMenu=true：行右键打开菜单并 emit context-menu（target=row）", async () => {
    const onContextMenu = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        onContextMenu,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element, { clientX: 10, clientY: 20 });
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onContextMenu.mock.calls[0]![0].target).toMatchObject({ kind: "row", rowKey: "1" });
    wrapper.unmount();
  });

  it("单元格右键 target=cell 且 rawValue 为原始值，row-contextmenu 仍照发", async () => {
    const onContextMenu = vi.fn();
    const rowMenu = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        onContextMenu,
        onRowContextmenu: rowMenu,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.findAll("td")[0]!.element);
    await vi.waitFor(() => expect(onContextMenu).toHaveBeenCalledTimes(1));
    expect(onContextMenu.mock.calls[0]![0].target).toMatchObject({
      kind: "cell",
      columnKey: "name",
      rawValue: USERS[0]!.name,
    });
    expect(rowMenu).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("items 为空不打开且不 emit context-menu", async () => {
    const onContextMenu = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: () => [],
        onContextMenu,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await flushPromises();
    expect(menuRoot()).toBeNull();
    expect(onContextMenu).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("业务 preventDefault 后不打开", async () => {
    const wrapper = mountWith(vi.fn());
    const onContextMenu = vi.fn();
    await wrapper.setProps({ contextMenu: true, onContextMenu } as never);
    await flushPromises();
    // 业务已 preventDefault 的事件：handler 首行早退
    const prevented = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
    prevented.preventDefault();
    wrapper.findAll("tbody tr")[0]!.element.dispatchEvent(prevented);
    await flushPromises();
    expect(menuRoot()).toBeNull();
    expect(onContextMenu).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("菜单内右键不重复打开（不重发 context-menu）", async () => {
    const onContextMenu = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        onContextMenu,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    fireContextMenu(menuRoot()!);
    await flushPromises();
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it("无 onSelect 的项 emit context-menu-select(value, ctx)", async () => {
    const onSelect = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: () => [{ value: "custom", label: "自定义" }],
        onContextMenuSelect: onSelect,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    await clickMenuItem("自定义");
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0]).toBe("custom");
    expect(onSelect.mock.calls[0]![1].target).toMatchObject({ kind: "row" });
    wrapper.unmount();
  });

  it("columnSettings:false 时默认项为空 → 不打开", async () => {
    const onContextMenu = vi.fn();
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        columnSettings: false,
        onContextMenu,
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await flushPromises();
    expect(menuRoot()).toBeNull();
    expect(onContextMenu).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("「列设置…」打开同一面板", async () => {
    const wrapper = mount(TableRender, {
      props: { rowKey: "id", columns: baseColumns(), data: USERS, contextMenu: true },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    await clickMenuItem("列设置…");
    await vi.waitFor(() =>
      expect(
        document.querySelector("[data-column-settings-panel]")?.closest("[data-scope='popover']"),
      ).not.toBeNull(),
    );
    wrapper.unmount();
  });

  it("「显示全部列」恢复全列", async () => {
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        visibleKeys: ["age"],
        "onUpdate:visible-keys": (keys: string[]) => wrapper.setProps({ visibleKeys: keys }),
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    await clickMenuItem("显示全部列");
    await flushPromises();
    expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["姓名", "年龄"]);
    wrapper.unmount();
  });

  it("「重置列」恢复 defaultVisibleKeys", async () => {
    const wrapper = mount(TableRender, {
      props: {
        rowKey: "id",
        columns: baseColumns(),
        data: USERS,
        contextMenu: true,
        defaultVisibleKeys: ["age"],
        visibleKeys: ["name", "age"],
        "onUpdate:visible-keys": (keys: string[]) => wrapper.setProps({ visibleKeys: keys }),
      },
      attachTo: document.body,
    });
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());
    await clickMenuItem("重置列");
    await flushPromises();
    expect(wrapper.findAll("thead th").map((th) => th.text())).toEqual(["年龄"]);
    wrapper.unmount();
  });

  it("搜索框右键不打开（resolver 排除 input）", async () => {
    const Host = defineComponent({
      setup() {
        const form = defineForm<User>({ items: [{ key: "name", title: "姓名", default: "" }] });
        const def = defineTable<User>({
          columns: baseColumns(),
          onLoad: () => {},
          search: form,
        } as never);
        return () =>
          h(TableRender, {
            rowKey: "id",
            definition: def,
            contextMenu: true,
          } as never);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body });
    await flushPromises();
    const input = wrapper.find("input");
    expect(input.exists()).toBe(true);
    fireContextMenu(input.element);
    await flushPromises();
    expect(menuRoot()).toBeNull();
    wrapper.unmount();
  });
});

// ---- 接管语义：屏蔽原生菜单 / 根相对定位 / 滚动关闭 -------------------------------

/** 挂载启用 contextMenu 的表格（默认可见集：重置项可用） */
function mountMenu(
  contextMenu: boolean | ((ctx: never) => unknown),
  extra: Record<string, unknown> = {},
) {
  return mount(TableRender, {
    props: {
      rowKey: "id",
      columns: baseColumns(),
      data: USERS,
      contextMenu,
      defaultVisibleKeys: ["name", "age"],
      ...extra,
    } as never,
    attachTo: document.body,
  });
}

describe("TableRender 右键接管语义", () => {
  it("启用后行 / 单元格 / 表头 / 表格空白右键均屏蔽原生菜单", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();

    const rowEvent = fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    expect(rowEvent.defaultPrevented).toBe(true);

    const cellEvent = fireContextMenu(wrapper.findAll("tbody tr")[0]!.findAll("td")[0]!.element);
    expect(cellEvent.defaultPrevented).toBe(true);

    const headerEvent = fireContextMenu(wrapper.find("thead th").element);
    expect(headerEvent.defaultPrevented).toBe(true);

    const tableEvent = fireContextMenu(wrapper.find("table").element);
    expect(tableEvent.defaultPrevented).toBe(true);

    wrapper.unmount();
  });

  it("items 为空：仍屏蔽原生菜单但不打开、不 emit", async () => {
    const onContextMenu = vi.fn();
    const wrapper = mountMenu(() => [] as never, { onContextMenu } as never);
    await flushPromises();

    const event = fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await flushPromises();
    expect(event.defaultPrevented).toBe(true);
    expect(menuRoot()).toBeNull();
    expect(onContextMenu).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("排除区：data-no-table-menu 与 input 保留原生菜单", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();

    const exempt = document.createElement("span");
    exempt.setAttribute("data-no-table-menu", "");
    exempt.textContent = "豁免";
    wrapper.element.appendChild(exempt);
    expect(fireContextMenu(exempt).defaultPrevented).toBe(false);

    const input = document.createElement("input");
    wrapper.element.appendChild(input);
    expect(fireContextMenu(input).defaultPrevented).toBe(false);
    expect(menuRoot()).toBeNull();
    wrapper.unmount();
  });

  it("表格外区域（工具栏等）不接管", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();

    const button = document.createElement("button");
    button.textContent = "工具栏";
    wrapper.element.appendChild(button);
    expect(fireContextMenu(button).defaultPrevented).toBe(false);
    expect(menuRoot()).toBeNull();
    wrapper.unmount();
  });

  it("锚点为 absolute 根相对坐标", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();
    wrapper.element.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 50,
        width: 400,
        height: 300,
        right: 500,
        bottom: 350,
        x: 100,
        y: 50,
        toJSON: () => ({}),
      }) as DOMRect;

    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element, { clientX: 128, clientY: 74 });
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());

    const anchor = wrapper.find("[data-table-menu-anchor]").element as HTMLElement;
    expect(anchor.style.position).toBe("absolute");
    expect(anchor.style.left).toBe("28px");
    expect(anchor.style.top).toBe("24px");
    wrapper.unmount();
  });

  it("页面滚动不关闭（浮层随表格移动）；表体滚动关闭", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();
    fireContextMenu(wrapper.findAll("tbody tr")[0]!.element);
    await vi.waitFor(() => expect(menuRoot()).not.toBeNull());

    window.dispatchEvent(new Event("scroll"));
    await flushPromises();
    expect(menuRoot()).not.toBeNull();

    const scrollEl = wrapper.element.querySelector(".overflow-x-auto")!;
    scrollEl.dispatchEvent(new Event("scroll"));
    await flushPromises();
    expect(menuRoot()).toBeNull();
    wrapper.unmount();
  });

  it("表体滚动同时关闭列设置面板", async () => {
    const wrapper = mountMenu(true as never);
    await flushPromises();
    const trigger = wrapper.find("[data-column-settings]");
    expect(trigger.exists()).toBe(true);
    await trigger.trigger("click");
    await flushPromises();
    await vi.waitFor(() =>
      expect(document.querySelector("[data-column-settings-panel]")).not.toBeNull(),
    );
    expect(
      document.querySelector<HTMLElement>("[data-column-settings-panel]")!.closest("[hidden]"),
    ).toBeNull();

    const scrollEl = wrapper.element.querySelector(".overflow-x-auto")!;
    scrollEl.dispatchEvent(new Event("scroll"));
    await vi.waitFor(() =>
      expect(
        document.querySelector<HTMLElement>("[data-column-settings-panel]")!.closest("[hidden]"),
      ).not.toBeNull(),
    );
    wrapper.unmount();
  });
});
