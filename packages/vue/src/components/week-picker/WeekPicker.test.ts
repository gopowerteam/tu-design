import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { isSameWeek, parseIsoDate, weekEndOf, weekStartOf } from "../date-shared/shared";
import { WeekPicker } from "./index";

// 日期硬编码 2026-10（月份推进时与日期家族套件统一调整）。
// 2026-10-15 为周四；zh-CN 周一起始 → 所在周为 2026-10-12 ~ 2026-10-18。
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("WeekPicker", () => {
  /** 受控 open 挂载并等待日格挂到 body（portal） */
  async function openPicker(props: Record<string, unknown> = {}) {
    const w = mount(WeekPicker, { props: { open: true, ...props }, attachTo: document.body });
    await vi.waitFor(() => {
      if (!document.body.querySelector('[data-scope="date-picker"] [role="grid"]')) {
        throw new Error("日历格子未挂载");
      }
    });
    return w;
  }

  function cell(value: string): HTMLElement {
    // 注意：TableCell(td) 与 TableCellTrigger(div) 都带 data-value，zag 的 onClick 在内层 trigger 上
    const el = document.body.querySelector<HTMLElement>(
      `[data-part="table-cell-trigger"][data-value="${value}"]`,
    );
    expect(el, `格子 ${value} 应存在`).toBeTruthy();
    return el!;
  }

  it("渲染输入框、触发按钮与清除按钮", () => {
    const w = mount(WeekPicker, { props: { modelValue: "2026-10-12" }, attachTo: document.body });
    expect(w.find("input").exists()).toBe(true);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
    w.unmount();
  });

  it("点任意日归一到所在周起始日（2026-10-15 周四 → 2026-10-12 周一）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ modelValue: "2026-10-12", "onUpdate:modelValue": onUpdate });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-12");
    w.unmount();
  });

  it("同周内任意一天归一结果一致（周日 2026-10-18 → 同一周起点）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ modelValue: "2026-10-12", "onUpdate:modelValue": onUpdate });
    cell("2026-10-18").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-12");
    w.unmount();
  });

  it("整周高亮：外部赋值后同周全部格子带 data-selected + data-week-selected（整行条带）", async () => {
    await openPicker({ modelValue: "2026-10-15" });
    for (const day of ["2026-10-12", "2026-10-15", "2026-10-18"]) {
      expect(cell(day).hasAttribute("data-selected"), `${day} 应整周高亮`).toBe(true);
      expect(cell(day).hasAttribute("data-week-selected"), `${day} 应带整行条带标记`).toBe(true);
    }
    expect(cell("2026-10-19").hasAttribute("data-selected")).toBe(false);
    expect(cell("2026-10-19").hasAttribute("data-week-selected")).toBe(false);
  });

  it("week 形态日视图行挂 group/week-row，hover 预览整行浅条带（非选中格）", async () => {
    await openPicker({ modelValue: "2026-10-15" });
    const anyTrigger = cell("2026-10-15");
    // 行级 hover 预览变体（非选中周/格子亮 primary/10，选中格排除）
    expect(anyTrigger.className).toContain(
      "group-hover/week-row:not-data-[week-selected]:not-data-[outside-view]:bg-primary/10",
    );
    // 非周选择形态不该有行级 hover 变体命中宿主（这里只断言类存在性由 week 形态提供）
    const row = anyTrigger.closest("tr");
    expect(row?.className).toContain("group/week-row");
  });

  it("输入框回显整周区间（format 钩子路径）", () => {
    const w = mount(WeekPicker, { props: { modelValue: "2026-03-04" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("2026-03-02 ~ 2026-03-08");
    w.unmount();
  });

  it("locale 切换周起点：en-US 周日起始（2026-10-15 → 2026-10-11）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({
      modelValue: "2026-10-11",
      locale: "en-US",
      "onUpdate:modelValue": onUpdate,
    });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-11");
    w.unmount();
  });

  it("有值时清除按钮可点并发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(WeekPicker, {
      props: { modelValue: "2026-10-12", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    expect(onUpdate).toHaveBeenLastCalledWith(null);
    w.unmount();
  });

  it("空值时点击清除无多余 emit（值已为空，无 onChange）", async () => {
    const onUpdate = vi.fn();
    const w = mount(WeekPicker, {
      props: { modelValue: null, "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    await w.find('[data-part="clear-trigger"]').trigger("click");
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("min 边界外格子不可选", async () => {
    await openPicker({ modelValue: "2026-10-12", min: "2026-10-13" });
    expect(cell("2026-10-12").hasAttribute("data-disabled")).toBe(true);
    expect(cell("2026-10-15").hasAttribute("data-disabled")).toBe(false);
  });

  it("非受控模式：defaultValue 归一到周起点，选周后内部值更新", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ defaultValue: "2026-10-15", "onUpdate:modelValue": onUpdate });
    expect((w.find("input").element as HTMLInputElement).value).toBe("2026-10-12 ~ 2026-10-18");
    cell("2026-10-14").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-12");
    w.unmount();
  });
});

describe("week 工具函数（date-shared）", () => {
  it("weekStartOf/weekEndOf：zh-CN 周一起始", () => {
    const start = weekStartOf(parse("2026-10-15"));
    expect(start.toString()).toBe("2026-10-12");
    expect(weekEndOf(parse("2026-10-15")).toString()).toBe("2026-10-18");
    // 周日 2026-10-18 仍属本周（周一起始）
    expect(weekStartOf(parse("2026-10-18")).toString()).toBe("2026-10-12");
  });

  it("weekStartOf：en-US 周日起始，非法 locale 兜底周一", () => {
    expect(weekStartOf(parse("2026-10-15"), "en-US").toString()).toBe("2026-10-11");
    // "not-a-locale" 实为合法语言子标签（not），其 weekInfo 周日起始
    expect(weekStartOf(parse("2026-10-15"), "not-a-locale").toString()).toBe("2026-10-11");
    // 非法 locale（Intl.Locale 构造抛错）兜底周一起始
    expect(weekStartOf(parse("2026-10-15"), "!!").toString()).toBe("2026-10-12");
  });

  it("isSameWeek：同周 true，跨周 false", () => {
    expect(isSameWeek(parse("2026-10-12"), parse("2026-10-18"))).toBe(true);
    expect(isSameWeek(parse("2026-10-18"), parse("2026-10-19"))).toBe(false);
  });

  /** "yyyy-MM-dd" → DateValue 的测试局部小助手 */
  function parse(raw: string) {
    const date = parseIsoDate(raw);
    expect(date, `非法测试日期 ${raw}`).toBeTruthy();
    return date!;
  }
});
