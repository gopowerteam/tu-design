import { mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { h, nextTick } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DESCRIPTIONS_BREAKPOINTS, packRows, resolveColumn } from "./columns";
import { Descriptions, type DescriptionsItemData } from "./index";

const ITEM = '[data-slot="descriptions-item"]';

const items: DescriptionsItemData[] = [
  { label: "姓名", content: "张三" },
  { label: "年龄", content: 28 },
  { label: "地址", content: "杭州市西湖区文三路 100 号" },
];

/** 从 style 属性文本中读取单条 CSS 声明（断言口径与浏览器序列化一致，不依赖布局） */
function styleValue(style: string, property: string): string | undefined {
  const match = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`).exec(style);
  return match?.[1]?.trim();
}

function styleOf(w: VueWrapper, selector: string, index = 0): string {
  return w.findAll(selector)[index]!.attributes("style") ?? "";
}

/** body 内联 grid-template-columns 中的列数 */
function columnsOf(w: VueWrapper): number {
  const value = styleValue(styleOf(w, '[data-slot="descriptions-body"]'), "grid-template-columns");
  const match = /repeat\((\d+),/.exec(value ?? "");
  return Number(match?.[1]);
}

function spansOf(rows: ReturnType<typeof packRows>["rows"]): number[][] {
  return rows.map((row) => row.map((cell) => cell.span));
}

describe("Descriptions / resolveColumn", () => {
  it("数字列数直接采用；非法值回落 1，小数截断", () => {
    expect(resolveColumn(3, 0)).toBe(3);
    expect(resolveColumn(0, 1280)).toBe(1);
    expect(resolveColumn(-2, 1280)).toBe(1);
    expect(resolveColumn(Number.NaN, 1280)).toBe(1);
    expect(resolveColumn(2.8, 1280)).toBe(2);
  });

  it("断点对象取「不超过视口宽度的最大断点」，全部未命中回落 base", () => {
    const column = { base: 1, sm: 2, lg: 3 };
    expect(resolveColumn(column, 500)).toBe(1);
    expect(resolveColumn(column, DESCRIPTIONS_BREAKPOINTS.sm)).toBe(2);
    expect(resolveColumn(column, DESCRIPTIONS_BREAKPOINTS.lg - 1)).toBe(2);
    expect(resolveColumn(column, DESCRIPTIONS_BREAKPOINTS.lg)).toBe(3);
    expect(resolveColumn(column, 4000)).toBe(3);
  });

  it("跳档配置取更窄的已定义断点；缺 base 时回落 1", () => {
    expect(resolveColumn({ lg: 3 }, 500)).toBe(1);
    expect(resolveColumn({ md: 2, xl: 4 }, 900)).toBe(2);
    expect(resolveColumn({ md: 2, xl: 4 }, 1300)).toBe(4);
    expect(resolveColumn({ sm: 2 }, 300)).toBe(1);
  });

  it("断点值同样净化：0 / 负数 / NaN 均不小于 1", () => {
    expect(resolveColumn({ base: 0, md: -2 }, 100)).toBe(1);
    expect(resolveColumn({ md: Number.NaN }, 800)).toBe(1);
  });

  it("运行时传入非对象非法值不抛错", () => {
    expect(resolveColumn(null as never, 800)).toBe(1);
    expect(resolveColumn(undefined as never, 800)).toBe(1);
  });
});

describe("Descriptions / packRows", () => {
  it("按列数分行，每行 span 之和恰等于列数，index 保持原始下标", () => {
    const result = packRows(items, 3);
    expect(spansOf(result.rows)).toEqual([[1, 1, 1]]);
    expect(result.clamped).toBe(false);
    expect(result.rows[0]!.map((cell) => cell.index)).toEqual([0, 1, 2]);
    expect(result.rows.flat().map((cell) => cell.item)).toEqual(items);
  });

  it("超出当前行剩余列的 span 被夹紧并封行", () => {
    const result = packRows([{ span: 2 }, { span: 2 }, { span: 1 }], 3);
    expect(spansOf(result.rows)).toEqual([[2, 1], [3]]);
    expect(result.clamped).toBe(true);
  });

  it("末行不足时拉伸最后一项补满（不计入 clamped）", () => {
    const result = packRows([{ span: 1 }, { span: 1 }, { span: 1 }, { span: 1 }], 3);
    expect(spansOf(result.rows)).toEqual([[1, 1, 1], [3]]);
    expect(result.clamped).toBe(false);
  });

  it("span 超过列数时夹到整行", () => {
    const result = packRows([{ span: 5 }, {}], 3);
    expect(spansOf(result.rows)).toEqual([[3], [3]]);
    expect(result.clamped).toBe(true);
  });

  it("非法 span 净化：0 / 负数 / NaN 回落 1，小数截断", () => {
    const invalid = packRows([{ span: 0 }, { span: -1 }, { span: Number.NaN }], 3);
    expect(spansOf(invalid.rows)).toEqual([[1, 1, 1]]);
    expect(invalid.clamped).toBe(false);

    const truncated = packRows([{ span: 2.7 }, {}], 3);
    expect(spansOf(truncated.rows)).toEqual([[2, 1]]);
    expect(truncated.clamped).toBe(false);
  });

  it("列数非法按 1 处理；空数组返回空行", () => {
    expect(spansOf(packRows(items, 0).rows)).toEqual([[1], [1], [1]]);
    expect(packRows([], 3)).toEqual({ rows: [], clamped: false });
  });

  it("不修改入参（夹紧 / 拉伸只作用于打包结果）", () => {
    const source: DescriptionsItemData[] = [{ span: 2 }, { span: 2 }];
    packRows(source, 3);
    expect(source).toEqual([{ span: 2 }, { span: 2 }]);
  });
});

describe("Descriptions", () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    window.innerWidth = originalWidth;
    vi.restoreAllMocks();
  });

  it("渲染 dl/dt/dd：每项分组 div 内恒为 dt + dd，data-slot 齐全，无头部", () => {
    const w = mount(Descriptions, { props: { items } });
    const body = w.find('[data-slot="descriptions-body"]');
    expect(body.element.tagName).toBe("DL");
    expect(w.find('[data-slot="descriptions"]').exists()).toBe(true);
    expect(w.find('[data-slot="descriptions-header"]').exists()).toBe(false);

    const cells = w.findAll(ITEM);
    expect(cells).toHaveLength(items.length);
    const labels = w.findAll('[data-slot="descriptions-label"]');
    const contents = w.findAll('[data-slot="descriptions-content"]');
    for (const [i, cell] of cells.entries()) {
      const children = cell.element.children;
      expect(children.length).toBe(2);
      expect(children[0]!.tagName).toBe("DT");
      expect(children[1]!.tagName).toBe("DD");
      expect(labels[i]!.text()).toBe(items[i]!.label);
      expect(contents[i]!.text()).toBe(String(items[i]!.content));
    }
  });

  it("默认 3 列：body 内联 repeat(3, minmax(0,1fr))，非 bordered 用普通间距", () => {
    const w = mount(Descriptions, { props: { items } });
    const body = w.find('[data-slot="descriptions-body"]');
    expect(columnsOf(w)).toBe(3);
    expect(body.classes()).toEqual(expect.arrayContaining(["grid", "gap-x-6", "gap-y-4"]));
    expect(body.classes()).not.toContain("bg-border");
    expect(w.classes()).not.toContain("border");
  });

  it("title / extra 渲染进头部；#title / #extra 插槽覆盖", () => {
    const w = mount(Descriptions, {
      props: { items, title: "用户信息", extra: "更新于 2 分钟前" },
    });
    const header = w.find('[data-slot="descriptions-header"]');
    expect(header.classes()).toContain("mb-3");
    const title = w.find('[data-slot="descriptions-title"]');
    expect(title.element.tagName).toBe("H3");
    expect(title.text()).toBe("用户信息");
    expect(w.find('[data-slot="descriptions-extra"]').text()).toBe("更新于 2 分钟前");

    const custom = mount(Descriptions, {
      props: { items },
      slots: { title: "<em>自定义标题</em>", extra: "<button>编辑</button>" },
    });
    expect(custom.find('[data-slot="descriptions-title"] em').text()).toBe("自定义标题");
    expect(custom.find('[data-slot="descriptions-extra"] button').text()).toBe("编辑");

    // 仅有 extra：头部仍渲染，extra 靠右
    const extraOnly = mount(Descriptions, { props: { items, extra: "只读" } });
    const extra = extraOnly.find('[data-slot="descriptions-extra"]');
    expect(extraOnly.find('[data-slot="descriptions-title"]').exists()).toBe(false);
    expect(extra.classes()).toContain("ml-auto");
    expect(extra.text()).toBe("只读");
  });

  it("bordered：圆角外框 + 头部底边线 + body gap-px/bg-border；top 模式 item 跨两行 subgrid", () => {
    const w = mount(Descriptions, { props: { items, title: "用户信息", bordered: true } });
    expect(w.classes()).toEqual(
      expect.arrayContaining(["rounded-lg", "border", "border-border", "overflow-hidden"]),
    );
    expect(w.find('[data-slot="descriptions-header"]').classes()).toContain("border-b");
    expect(w.find('[data-slot="descriptions-body"]').classes()).toEqual(
      expect.arrayContaining(["gap-px", "bg-border"]),
    );

    const cell = w.find(ITEM);
    // item 自身透明：线条来自 body 背景在 1px 间隙处透出
    expect(cell.classes()).toEqual(
      expect.arrayContaining(["grid", "row-span-2", "grid-rows-subgrid"]),
    );
    expect(cell.classes()).not.toContain("flex");
    expect(cell.classes()).not.toContain("bg-background");
    expect(w.find('[data-slot="descriptions-label"]').classes()).toContain("bg-muted");
    expect(w.find('[data-slot="descriptions-content"]').classes()).toContain("bg-background");
  });

  it("top + 非 bordered：item 纵向堆叠，标签弱化色、内容前景色，无单元格 padding", () => {
    const w = mount(Descriptions, { props: { items } });
    expect(w.find(ITEM).classes()).toEqual(expect.arrayContaining(["flex", "flex-col"]));
    const label = w.find('[data-slot="descriptions-label"]');
    expect(label.classes()).toContain("text-muted-foreground");
    expect(label.classes()).not.toContain("bg-muted");
    expect(label.classes()).not.toContain("px-3");
    expect(w.find('[data-slot="descriptions-content"]').classes()).toContain("text-foreground");
  });

  it("left：标签轨道宽度——bordered 缺省 8rem，非 bordered 缺省 auto，显式 labelWidth 优先", () => {
    const track = (props: Record<string, unknown>) =>
      styleValue(
        styleOf(mount(Descriptions, { props: { items, ...props } }), ITEM),
        "grid-template-columns",
      );

    expect(track({ labelPlacement: "left", bordered: true })).toBe("8rem minmax(0, 1fr)");
    expect(track({ labelPlacement: "left" })).toBe("auto minmax(0, 1fr)");
    expect(track({ labelPlacement: "left", labelWidth: 120 })).toBe("120px minmax(0, 1fr)");
    expect(track({ labelPlacement: "left", labelWidth: "6rem" })).toBe("6rem minmax(0, 1fr)");
    // 非法值回落模式默认
    expect(track({ labelPlacement: "left", labelWidth: 0, bordered: true })).toBe(
      "8rem minmax(0, 1fr)",
    );
    expect(track({ labelPlacement: "left", labelWidth: "  " })).toBe("auto minmax(0, 1fr)");
    // top 模式不写标签轨道
    expect(track({ labelPlacement: "top", labelWidth: 120 })).toBeUndefined();
  });

  it("left：item 为两列网格，bordered 时列间 1px 间隙形成标签/内容竖线", () => {
    const bordered = mount(Descriptions, {
      props: { items, labelPlacement: "left", bordered: true },
    });
    expect(bordered.find(ITEM).classes()).toEqual(expect.arrayContaining(["grid", "gap-x-px"]));
    expect(bordered.find('[data-slot="descriptions-label"]').classes()).toContain("bg-muted");

    const plain = mount(Descriptions, { props: { items, labelPlacement: "left" } });
    expect(plain.find(ITEM).classes()).toContain("gap-x-3");
    expect(plain.find(ITEM).classes()).not.toContain("row-span-2");
  });

  it("labelAlign 仅在 left 模式作用于标签", () => {
    const left = mount(Descriptions, {
      props: { items, labelPlacement: "left", labelAlign: "right" },
    });
    expect(left.find('[data-slot="descriptions-label"]').classes()).toContain("text-right");
    const center = mount(Descriptions, {
      props: { items, labelPlacement: "left", labelAlign: "center" },
    });
    expect(center.find('[data-slot="descriptions-label"]').classes()).toContain("text-center");

    const top = mount(Descriptions, { props: { items, labelAlign: "right" } });
    expect(top.find('[data-slot="descriptions-label"]').classes()).not.toContain("text-right");
  });

  it("separator 仅在 left + 非 bordered + 有标签时渲染，空串关闭", () => {
    const left = mount(Descriptions, { props: { items, labelPlacement: "left" } });
    const separators = left.findAll('[data-slot="descriptions-separator"]');
    expect(separators).toHaveLength(items.length);
    expect(separators[0]!.text()).toBe(":");
    // 纯标点，对读屏器隐藏
    expect(separators[0]!.attributes("aria-hidden")).toBe("true");
    expect(left.find('[data-slot="descriptions-label"]').text()).toBe("姓名:");

    const custom = mount(Descriptions, {
      props: { items, labelPlacement: "left", separator: " →" },
    });
    expect(custom.find('[data-slot="descriptions-separator"]').text()).toBe("→");

    for (const props of [
      { labelPlacement: "left" as const, bordered: true },
      { labelPlacement: "top" as const },
      { labelPlacement: "left" as const, separator: "" },
    ]) {
      const w = mount(Descriptions, { props: { items, ...props } });
      expect(w.find('[data-slot="descriptions-separator"]').exists()).toBe(false);
    }

    const noLabel = mount(Descriptions, {
      props: { items: [{ content: "无标签" }], labelPlacement: "left" },
    });
    expect(noLabel.find('[data-slot="descriptions-separator"]').exists()).toBe(false);
  });

  it("无 label 的项仍渲染空 dt（dl 分组合法）；content 为 0 正常显示，缺省为空", () => {
    const w = mount(Descriptions, {
      props: { items: [{ content: 0 }, { label: "备注" }, { label: "数量", content: 3 }] },
    });
    const cells = w.findAll(ITEM);
    const firstLabel = cells[0]!.element.children[0]!;
    expect(firstLabel.tagName).toBe("DT");
    expect(firstLabel.textContent?.trim()).toBe("");

    const contents = w.findAll('[data-slot="descriptions-content"]');
    expect(contents[0]!.text()).toBe("0");
    expect(contents[1]!.text()).toBe("");
    expect(w.findAll('[data-slot="descriptions-label"]')[1]!.text()).toBe("备注");
  });

  it("span 经行打包后写入 grid-column：跨列、夹紧、末项拉伸", () => {
    const w = mount(Descriptions, {
      props: {
        column: 3,
        items: [{ label: "a", span: 2 }, { label: "b", span: 2 }, { label: "c" }],
      },
    });
    expect(
      w.findAll(ITEM).map((cell) => styleValue(cell.attributes("style") ?? "", "grid-column")),
    ).toEqual(["span 2", "span 1", "span 3"]);
  });

  it("#label / #content 作用域插槽接收 { item, index } 并覆盖默认文本", () => {
    const w = mount(Descriptions, {
      props: { items },
      slots: {
        label: ({ item, index }: { item: DescriptionsItemData; index: number }) =>
          h("b", `${index}:${item.label}`),
        content: ({ item, index }: { item: DescriptionsItemData; index: number }) =>
          h("i", `#${index}:${item.content}`),
      },
    });
    expect(w.findAll('[data-slot="descriptions-label"] b')[0]!.text()).toBe("0:姓名");
    expect(w.findAll('[data-slot="descriptions-content"] i')[2]!.text()).toBe(
      "#2:杭州市西湖区文三路 100 号",
    );
  });

  it("用户 class 与容器默认类经 cn 合并", () => {
    const w = mount(Descriptions, { props: { items, class: "my-6 max-w-md" } });
    expect(w.classes()).toEqual(expect.arrayContaining(["w-full", "my-6", "max-w-md"]));
  });

  it("空 items 渲染空 dl（无 item）", () => {
    const w = mount(Descriptions, { props: { items: [] } });
    expect(w.find('[data-slot="descriptions-body"]').exists()).toBe(true);
    expect(w.findAll(ITEM)).toHaveLength(0);
  });

  it("size 联动字号；padding 仅 bordered 生效（含头部）", () => {
    const plain = mount(Descriptions, { props: { items, size: "lg" } });
    const plainContent = plain.find('[data-slot="descriptions-content"]');
    expect(plainContent.classes()).toContain("text-base");
    expect(plainContent.classes()).not.toContain("px-4");

    const sm = mount(Descriptions, { props: { items, size: "sm", bordered: true } });
    expect(sm.find('[data-slot="descriptions-content"]').classes()).toEqual(
      expect.arrayContaining(["text-xs", "px-2.5", "py-1.5"]),
    );
    expect(sm.find('[data-slot="descriptions-header"]').exists()).toBe(false);

    const lg = mount(Descriptions, {
      props: { items, size: "lg", bordered: true, title: "尺寸" },
    });
    expect(lg.find('[data-slot="descriptions-label"]').classes()).toEqual(
      expect.arrayContaining(["text-base", "px-4", "py-3"]),
    );
    expect(lg.find('[data-slot="descriptions-header"]').classes()).toEqual(
      expect.arrayContaining(["px-4", "py-3"]),
    );
    expect(lg.find('[data-slot="descriptions-title"]').classes()).toContain("text-lg");
  });

  it("断点对象：SSR / 首帧按 base 渲染，挂载后按视口校正，resize 跨档才更新", async () => {
    const column = { base: 1, sm: 2, lg: 3 };
    const html = await renderToString(h(Descriptions, { items, column }));
    expect(html).toMatch(/grid-template-columns:\s*repeat\(1,/);

    window.innerWidth = 400;
    const w = mount(Descriptions, { props: { items, column } });
    expect(columnsOf(w)).toBe(1);

    window.innerWidth = DESCRIPTIONS_BREAKPOINTS.sm;
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(columnsOf(w)).toBe(2);

    // 同一档内变化不改变列数
    window.innerWidth = 900;
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(columnsOf(w)).toBe(2);

    window.innerWidth = DESCRIPTIONS_BREAKPOINTS.lg;
    window.dispatchEvent(new Event("resize"));
    await nextTick();
    expect(columnsOf(w)).toBe(3);
  });

  it("数字列数不挂 resize 监听；断点对象按需挂载 / 卸载；列数切换同步重排", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const resizeAdds = () => add.mock.calls.filter(([type]) => type === "resize").length;
    const resizeRemoves = () => remove.mock.calls.filter(([type]) => type === "resize").length;

    const fixed = mount(Descriptions, { props: { items, column: 3 } });
    expect(resizeAdds()).toBe(0);
    await fixed.setProps({ column: 1 });
    expect(columnsOf(fixed)).toBe(1);
    expect(resizeAdds()).toBe(0);

    await fixed.setProps({ column: { base: 1, md: 3 } });
    expect(resizeAdds()).toBe(1);
    fixed.unmount();
    expect(resizeRemoves()).toBe(1);

    add.mockClear();
    remove.mockClear();
    const responsive = mount(Descriptions, { props: { items, column: { base: 1, md: 3 } } });
    expect(resizeAdds()).toBe(1);
    await responsive.setProps({ column: 2 });
    expect(resizeRemoves()).toBe(1);
    expect(columnsOf(responsive)).toBe(2);
    responsive.unmount();
    // 已移除的监听不重复移除
    expect(resizeRemoves()).toBe(1);
  });

  it("DEV 下 span 夹紧只提示一次；未夹紧不提示", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(Descriptions, { props: { items } });
    expect(warn).not.toHaveBeenCalled();

    const clamped: DescriptionsItemData[] = [{ span: 2 }, { span: 2 }, {}];
    const w = mount(Descriptions, { props: { items: clamped, column: 3 } });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain("Descriptions");

    await w.setProps({ items: [...clamped] });
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
