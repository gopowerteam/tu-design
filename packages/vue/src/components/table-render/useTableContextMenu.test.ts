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

  it("排除区：input / textarea / contenteditable / data-no-table-menu / menu / defaultPrevented", () => {
    const fixtures = [
      '<table><tbody><tr data-row-key="r1"><td><input /></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><textarea></textarea></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><div contenteditable="true">x</div></td></tr></tbody></table>',
      '<table><tbody><tr data-row-key="r1"><td><span data-no-table-menu>x</span></td></tr></tbody></table>',
      '<div data-scope="menu"><span>x</span></div>',
    ];
    const selectors = [
      "input",
      "textarea",
      '[contenteditable="true"]',
      "[data-no-table-menu]",
      "span",
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
});

describe("useTableContextMenu 控制器协议", () => {
  const snapshot = () => ({
    selection: { keys: [] as string[], rows: [] as Row[] },
    visibleKeys: ["name"] as readonly string[],
    columns: [{ key: "name", title: "姓名" }] as const,
  });

  it("items 为空不打开且不 emit", () => {
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
    expect(controller.onContextMenu(event)).toBe(false);
    expect(controller.open.value).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
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

  it("anchorStyle 记录右键坐标（fixed 0x0）", () => {
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
    });
    const { host, event } = dispatch(
      '<table><tbody><tr data-row-key="r1"><td><span>x</span></td></tr></tbody></table>',
      "span",
      { clientX: 12, clientY: 34 },
    );
    controller.onContextMenu(event);
    expect(controller.anchorStyle.value).toMatchObject({
      position: "fixed",
      width: "0",
      height: "0",
      left: "12px",
      top: "34px",
    });
    host.remove();
  });
});
