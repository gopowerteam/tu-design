import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DateRangePicker } from "./index";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DateRangePicker", () => {
  /** 受控 open 挂载并等待弹层内容挂到 body（portal） */
  async function openPicker(props: Record<string, unknown> = {}) {
    const w = mount(DateRangePicker, { props: { open: true, ...props }, attachTo: document.body });
    await vi.waitFor(() => {
      if (!document.body.querySelector('[data-scope="date-picker"] [role="grid"]')) {
        throw new Error("日历格子未挂载");
      }
    });
    return w;
  }

  function cell(value: string): HTMLElement {
    const el = document.body.querySelector<HTMLElement>(
      `[data-part="table-cell-trigger"][data-value="${value}"]`,
    );
    expect(el, `格子 ${value} 应存在`).toBeTruthy();
    return el!;
  }

  it("渲染输入框、触发按钮与清除按钮（range 原生双框：起/止各一）", () => {
    const w = mount(DateRangePicker, {
      props: { modelValue: ["2026-10-09", "2026-10-15"] },
      attachTo: document.body,
    });
    expect(w.findAll("input").length).toBe(2);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
    w.unmount();
  });

  it("range 回显完整：外部赋值后起/止 input 各显一段（zag syncInputElement 按框分配）", () => {
    const w = mount(DateRangePicker, {
      props: { modelValue: ["2026-10-01", "2026-10-10"] },
      attachTo: document.body,
    });
    const inputs = w.findAll("input");
    expect(inputs.length).toBe(2);
    expect((inputs[0].element as HTMLInputElement).value).toBe("2026-10-01");
    expect((inputs[1].element as HTMLInputElement).value).toBe("2026-10-10");
    w.unmount();
  });

  it("双月渲染（numOfMonths 默认 2）：跨月格子同时可见", async () => {
    await openPicker({ modelValue: ["2026-10-09", "2026-10-15"] });
    cell("2026-10-15");
    cell("2026-11-15");
  });

  it("点起点再点终点 → emit 有序 [ISO, ISO] 元组", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ "onUpdate:modelValue": onUpdate });
    cell("2026-10-09").click();
    await w.vm.$nextTick();
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith(["2026-10-09", "2026-10-15"]);
    w.unmount();
  });

  it("乱序点选（先终点后起点）→ emit 仍按 start ≤ end 归一", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ "onUpdate:modelValue": onUpdate });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    cell("2026-10-09").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith(["2026-10-09", "2026-10-15"]);
    w.unmount();
  });

  it("mirror 回归锁：受控父组件不回显时，pending start 不丢、第二次点击仍完成选择", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ "onUpdate:modelValue": onUpdate });
    cell("2026-10-09").click();
    await w.vm.$nextTick();
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith(["2026-10-09", "2026-10-15"]);
    w.unmount();
  });

  it("完整区间后点击新格子 → 开新区间（先 emit null 再 emit 新元组）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({
      modelValue: ["2026-10-01", "2026-10-10"],
      "onUpdate:modelValue": onUpdate,
    });
    cell("2026-10-20").click();
    await w.vm.$nextTick();
    cell("2026-10-25").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith(["2026-10-20", "2026-10-25"]);
    w.unmount();
  });

  it("外部 modelValue 同步：两端格子带 data-selected", async () => {
    await openPicker({ modelValue: ["2026-10-01", "2026-10-10"] });
    expect(cell("2026-10-01").hasAttribute("data-selected")).toBe(true);
    expect(cell("2026-10-10").hasAttribute("data-selected")).toBe(true);
    expect(cell("2026-10-05").hasAttribute("data-in-range")).toBe(true);
  });

  it("有值时清除按钮可点并发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(DateRangePicker, {
      props: { modelValue: ["2026-10-09", "2026-10-15"], "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    expect(onUpdate).toHaveBeenLastCalledWith(null);
    w.unmount();
  });

  it("min/max 边界外格子不可选", async () => {
    await openPicker({
      modelValue: ["2026-10-09", "2026-10-15"],
      min: "2026-10-05",
      max: "2026-10-20",
    });
    expect(cell("2026-10-01").hasAttribute("data-disabled")).toBe(true);
    expect(cell("2026-10-25").hasAttribute("data-disabled")).toBe(true);
  });

  it("isDateUnavailable 命中格子不可选", async () => {
    await openPicker({
      modelValue: ["2026-10-09", "2026-10-15"],
      isDateUnavailable: (d: { day: number }) => d.day === 12,
    });
    expect(cell("2026-10-12").hasAttribute("data-disabled")).toBe(true);
    expect(cell("2026-10-13").hasAttribute("data-disabled")).toBe(false);
  });

  it("closeOnSelect：选起点不关弹层，选终点才关", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ "onUpdate:open": onOpen });
    cell("2026-10-09").click();
    await w.vm.$nextTick();
    expect(onOpen).not.toHaveBeenCalledWith(false);
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("受控 open 时 Esc 关闭发出 update:open false", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ "onUpdate:open": onOpen });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("键盘 ArrowDown 聚焦输入框可打开弹层并 emit update:open true", async () => {
    const onOpen = vi.fn();
    const w = mount(DateRangePicker, {
      props: { "onUpdate:open": onOpen },
      attachTo: document.body,
    });
    const content = () => document.body.querySelector('[data-part="content"]');
    expect(content()?.getAttribute("data-state")).toBe("closed");
    await w.find("input").trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(content()?.getAttribute("data-state")).toBe("open"));
    expect(onOpen).toHaveBeenCalledWith(true);
    w.unmount();
  });

  it("attrs 透传首框 input（id/aria-label，label 关联语义）；次框不重复", () => {
    const w = mount(DateRangePicker, {
      attrs: { id: "range", "aria-label": "起止日期" },
      attachTo: document.body,
    });
    const inputs = w.findAll("input");
    expect(inputs.length).toBe(2);
    expect(inputs[0].attributes("id")).toBe("range");
    expect(inputs[0].attributes("aria-label")).toBe("起止日期");
    // 次框 id 由 ark 自动生成（...:input:1），不透传 attrs
    expect(inputs[1].attributes("id")).not.toBe("range");
    expect(inputs[1].attributes("aria-label")).not.toBe("起止日期");
    w.unmount();
  });

  it("非法 modelValue 不崩且忽略", () => {
    const w = mount(DateRangePicker, {
      props: { modelValue: ["abc", "2026-10-09"] },
      attachTo: document.body,
    });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    w.unmount();
  });

  it("非受控 defaultValue 初始化区间", async () => {
    await openPicker({ defaultValue: ["2026-10-01", "2026-10-10"] });
    expect(cell("2026-10-01").hasAttribute("data-selected")).toBe(true);
    expect(cell("2026-10-10").hasAttribute("data-selected")).toBe(true);
  });

  it("range 样式：全格 primary/10 无缝条带、端点外侧小圆角、端点选中主色圆点", async () => {
    await openPicker({ modelValue: ["2026-10-03", "2026-10-28"] });
    const start = cell("2026-10-03");
    const middle = cell("2026-10-05");
    const end = cell("2026-10-28");
    expect(start.hasAttribute("data-in-range")).toBe(true);
    expect(middle.hasAttribute("data-in-range")).toBe(true);
    // 条带层在 trigger 全格（naive 对齐：primary @ 10% alpha）；排除本表月份外的补位格
    expect(middle.className).toContain(
      "data-[in-range]:not-data-[outside-view]:not-data-[range-start]:not-data-[range-end]:bg-primary/10",
    );
    // 端点：外侧小圆角
    expect(start.className).toContain("data-[range-start]:rounded-l-[3px]");
    expect(end.className).toContain("data-[range-end]:rounded-r-[3px]");
    // 视觉层：端点选中 24px 圆点主色；本表月份外补位格不参与（防止端点在双月表重复高亮）
    const startDot = start.firstElementChild as HTMLElement;
    expect(startDot.className).toContain("size-6");
    expect(startDot.className).toContain(
      "group-data-[selected]:not-group-data-[week-selected]:not-group-data-[outside-view]:bg-primary",
    );
    // 补位端点存在性（用户 bug 回归锁）：右表首行的 10-28 属于 10 月表 → 带 outside-view，
    // 同时 zag 按 date 值标 selected/range-end；修复后其 dot 不再渲染选中主色，且不可点击
    const trailingEnd = document.body.querySelector(
      '[data-part="table-cell-trigger"][data-outside-view][data-selected][data-range-end]',
    );
    expect(trailingEnd).toBeTruthy();
    expect(trailingEnd!.className).toContain("data-[outside-view]:pointer-events-none");
  });

  it("zh-CN 默认周一起始，表头单字显示（一/二/三，非周一/周二）", async () => {
    await openPicker({ modelValue: ["2026-10-01", "2026-10-10"] });
    const headers = [...document.body.querySelectorAll("[role='grid'] thead th")];
    expect(headers[0]?.textContent?.trim()).toBe("一");
    for (const th of headers) {
      expect(th.textContent).not.toContain("周");
      expect(th.textContent!.length).toBeLessThanOrEqual(1);
    }
  });

  it("第二月当月格可选（zag getUnitDuration 强制置 1 → 可见范围误缩为首月，outsideDaySelectable 对冲）", async () => {
    await openPicker({ modelValue: ["2026-10-03", "2026-10-28"] });
    const nov = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-value="2026-11-15"]',
    );
    expect(nov).toBeTruthy();
    expect(nov!.hasAttribute("data-disabled")).toBe(false);
    expect(nov!.hasAttribute("data-selectable")).toBe(true);
  });

  it("弹层内无嵌套日历弹层（TCalendar embedded 形态不自建 Root/Content）", async () => {
    await openPicker({ modelValue: ["2026-10-03", "2026-10-28"] });
    expect(document.body.querySelectorAll('[data-part="content"]').length).toBe(1);
  });

  it("弹层 Portal 化：Positioner 直挂 body", async () => {
    await openPicker();
    const positioner = document.body.querySelector('[data-part="positioner"]');
    expect(positioner?.parentElement, "Positioner 应直挂 body").toBe(document.body);
  });
});
