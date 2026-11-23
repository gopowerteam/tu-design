import { describe, expect, it, vi } from "vite-plus/test";
import { defaultTableMenuItems } from "./context-menu-types";
import { resolveTableContextTarget, useTableContextMenu } from "./useTableContextMenu";
import type { ContextTargetMeta } from "./useTableContextMenu";

// Phase 4：右键 resolver 九态 + 控制器协议（先关后执行 / 空项不打开 / 排除区）。

interface Row {
  id: number;
  name: string;
}

const META: ContextTargetMeta<Row> = {
  rowOf: (key) => (key === "r1" ? { record: { id: 1, name: "甲" }, index: 0 } : undefined),
  columnOf: (key) => (key === "name" ? { key: "name", title: "姓名" } : undefined),
  groupOf: (path) => (path === "0" ? { title: "基本信息", children: [] } : undefined),
};

/** 构造 fixture 并派发 contextmenu（返回事件，便于断言 defaultPrevented） */
function dispatch(html: string, selector: string, init: MouseEventInit = {}) {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.appendChild(host);
  const el = host.querySelector(selector);
  if (!el) throw new Error(`fixture 缺少 ${selector}`);
  const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return { host, event, el };
}

describe("resolveTableContextTarget 九态", () => {
  it("table / 空 / 错误 / 骨架 / 分页", () => {
    const cases: Array<[string, string]> = [
      ["<div><table><tbody><tr><td>x</td></tr></tbody></table></div>", "table"],
      [
        "<table><tbody><tr data-empty data-table-empty><td>x</td></tr></tbody></table>",
        "[data-table-empty]",
      ],
      [
        "<table><tbody><tr data-error data-table-error><td>x</td></tr></tbody></table>",
        "[data-table-error]",
      ],
      [
        "<table><tbody><tr data-skeleton data-table-skeleton><td>x</td></tr></tbody></table>",
        "[data-table-skeleton]",
      ],
      ["<div data-table-pagination><button>x</button></div>", "button"],
    ];
    const kinds = ["table", "empty", "error", "skeleton", "pagination"];
    cases.forEach(([html, selector], index) => {
      const { host, event } = dispatch(html, selector);
      const target = resolveTableContextTarget(event, META);
      expect(target?.kind).toBe(kinds[index]);
      host.remove();
    });
  });

  it("header 叶子 / header 分组 / row / cell（rawValue 为原始值而非 VNode）", () => {
    const leaf = dispatch(
      '<table><thead><tr><th data-column-key="name"><span>姓名</span></th></tr></thead></table>',
      "span",
    );
    expect(resolveTableContextTarget(leaf.event, META)).toMatchObject({
      kind: "header",
      columnKey: "name",
    });
    leaf.host.remove();

    const group = dispatch(
      '<table><thead><tr><th data-column-group="0"><span>组</span></th></tr></thead></table>',
      "span",
    );
    expect(resolveTableContextTarget(group.event, META)).toMatchObject({
      kind: "header",
      groupPath: "0",
    });
    group.host.remove();

    const row = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>行</span></td></tr></tbody></table>',
      "span",
    );
    expect(resolveTableContextTarget(row.event, META)).toMatchObject({ kind: "row", rowKey: "r1" });
    row.host.remove();

    const cell = dispatch(
      '<table><tbody><tr data-row-key="r1"><td data-column-key="name"><span>甲</span></td></tr></tbody></table>',
      "span",
    );
    expect(resolveTableContextTarget(cell.event, META)).toMatchObject({
      kind: "cell",
      columnKey: "name",
      rawValue: "甲",
    });
    cell.host.remove();
  });

  it("排除区：input / textarea / select / contenteditable / data-no-table-menu / menu / 列设置面板", () => {
    const fixtures = [
      '<table><tbody><tr data-row-key="r1"><td><input /></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><textarea></textarea></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><select><option>x</option></select></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><div contenteditable="true">x</div></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><span data-no-table-menu>x</span></td></tr></tbody></table>',
      '<div data-scope="menu"><span>x</span></div>',
      "<div data-column-settings-panel><button>x</button></div>",
    ];
    const selectors = [
      "input",
      "textarea",
      "select",
      '[contenteditable="true"]',
      "[data-no-table-menu]",
      "span",
      "button",
    ];
    fixtures.forEach((html, index) => {
      const { host, event } = dispatch(html, selectors[index]!);
      expect(resolveTableContextTarget(event, META)).toBeUndefined();
      host.remove();
    });

    const prevented = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
    );
    prevented.event.preventDefault();
    expect(resolveTableContextTarget(prevented.event, META)).toBeUndefined();
    prevented.host.remove();
  });

  it("表格外兜底：工具栏等非表格区域不接管（避免吞掉原生右键）", () => {
    const toolbar = dispatch("<div><button>列设置</button></div>", "button");
    expect(resolveTableContextTarget(toolbar.event, META)).toBeUndefined();
    toolbar.host.remove();

    const pagination = dispatch("<div data-table-pagination><button>x</button></div>", "button");
    expect(resolveTableContextTarget(pagination.event, META)).toMatchObject({ kind: "pagination" });
    pagination.host.remove();
  });
});

describe("useTableContextMenu 控制器协议", () => {
  const snapshot = () => ({
    selection: { keys: [] as string[], rows: [] as Row[] },
    visibleKeys: ["name"] as readonly string[],
    columns: [{ key: "name", title: "姓名" }] as const,
  });

  it("items 为空：仍接管（屏蔽原生菜单）但不打开、不 emit，DEV 警告只发一次", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onOpen = vi.fn();
    const controller = useTableContextMenu<Row>({
      menu: () => () => [],
      snapshot,
      defaults: () => ({
        columnSettingsEnabled: true,
        hasDefaultVisibleKeys: false,
        openColumnSettings: () => {},
        resetColumns: () => {},
        showAllColumns: () => {},
      }),
      meta: () => META,
      onOpen,
    });
    const { host, event } = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
    );
    expect(controller.onContextMenu(event)).toBe(true);
    expect(controller.open.value).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
    controller.onContextMenu(event);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain("contextMenu 已启用但当前右键目标没有可用菜单项");
    warn.mockRestore();
    host.remove();
  });

  it("先关后执行 onSelect；无 onSelect 走宿主回调", () => {
    const seen: boolean[] = [];
    const fallback = vi.fn();
    const controller = useTableContextMenu<Row>({
      menu: () => () => [
        {
          value: "a",
          label: "A",
          onSelect: () => {
            seen.push(controller.open.value);
          },
        },
        { value: "b", label: "B" },
      ],
      snapshot,
      defaults: () => ({
        columnSettingsEnabled: true,
        hasDefaultVisibleKeys: false,
        openColumnSettings: () => {},
        resetColumns: () => {},
        showAllColumns: () => {},
      }),
      meta: () => META,
      onMenuSelect: fallback,
    });
    const { host, event } = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
    );
    expect(controller.onContextMenu(event)).toBe(true);
    expect(controller.open.value).toBe(true);
    controller.onSelect("a");
    expect(seen).toEqual([false]); // 先关后执行
    controller.onSelect("b");
    expect(fallback).toHaveBeenCalledWith("b", expect.objectContaining({ event }));
    host.remove();
  });

  it("默认项：列设置/重置/显示全部；columnSettings=false 时为空", () => {
    const ctx = {
      target: { kind: "table" } as const,
      event: new MouseEvent("contextmenu"),
      selection: { keys: [], rows: [] },
      visibleKeys: [],
      columns: [],
      close: () => {},
    };
    const base = {
      columnSettingsEnabled: true,
      hasDefaultVisibleKeys: true,
      openColumnSettings: vi.fn(),
      resetColumns: vi.fn(),
      showAllColumns: vi.fn(),
    };
    expect(defaultTableMenuItems(ctx, base).map((i) => ("value" in i ? i.value : i.type))).toEqual([
      "column-settings",
      "reset-columns",
      "show-all-columns",
    ]);
    expect(
      defaultTableMenuItems(ctx, { ...base, hasDefaultVisibleKeys: false }).map((i) =>
        "value" in i ? i.value : i.type,
      ),
    ).toEqual(["column-settings", "show-all-columns"]);
    expect(defaultTableMenuItems(ctx, { ...base, columnSettingsEnabled: false })).toHaveLength(0);
  });

  it("anchorStyle 记录根节点相对坐标（absolute 0x0）", () => {
    const root = document.createElement("div");
    root.getBoundingClientRect = () =>
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
    const controller = useTableContextMenu<Row>({
      menu: () => () => [{ value: "a", label: "A" }],
      snapshot,
      defaults: () => ({
        columnSettingsEnabled: true,
        hasDefaultVisibleKeys: false,
        openColumnSettings: () => {},
        resetColumns: () => {},
        showAllColumns: () => {},
      }),
      meta: () => META,
      getRoot: () => root,
    });
    const { host, event } = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
      { clientX: 128, clientY: 74 },
    );
    controller.onContextMenu(event);
    expect(controller.anchorStyle.value).toMatchObject({
      position: "absolute",
      width: "0",
      height: "0",
      left: "28px",
      top: "24px",
    });
    host.remove();
  });

  it("沙箱回退：anchorPosition=fixed 时保留视口坐标", () => {
    const controller = useTableContextMenu<Row>({
      menu: () => () => [{ value: "a", label: "A" }],
      snapshot,
      defaults: () => ({
        columnSettingsEnabled: true,
        hasDefaultVisibleKeys: false,
        openColumnSettings: () => {},
        resetColumns: () => {},
        showAllColumns: () => {},
      }),
      meta: () => META,
      anchorPosition: () => "fixed",
    });
    const { host, event } = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
      { clientX: 12, clientY: 34 },
    );
    controller.onContextMenu(event);
    expect(controller.anchorStyle.value).toMatchObject({
      position: "fixed",
      left: "12px",
      top: "34px",
    });
    host.remove();
  });
});
