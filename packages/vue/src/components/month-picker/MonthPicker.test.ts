import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { MonthPicker } from "./index";

// 日期硬编码 2026-10（月份推进时与日期家族套件统一调整）。
// M10 机制出处：zag normalizeValue 对 number 型 cell value 做 focusedValue.set({month})，
// 继承 focusedValue 的 day（无值打开时 focusedValue=今天，machine.mjs 初始链）。
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("MonthPicker", () => {
  /** 受控 open 挂载并等待月格挂到 body（portal） */
  async function openPicker(props: Record<string, unknown> = {}) {
    const w = mount(MonthPicker, { props: { open: true, ...props }, attachTo: document.body });
    await vi.waitFor(() => {
      if (
        !document.body.querySelector(
          '[data-scope="date-picker"] [data-part="table-cell-trigger"][data-view="month"]',
        )
      ) {
        throw new Error("月格未挂载");
      }
    });
    return w;
  }

  function monthCell(value: string): HTMLElement {
    const el = document.body.querySelector<HTMLElement>(
      `[data-part="table-cell-trigger"][data-view="month"][data-value="${value}"]`,
    );
    expect(el, `月格 ${value} 应存在`).toBeTruthy();
    return el!;
  }

  it("渲染输入框、触发按钮与清除按钮", () => {
    const w = mount(MonthPicker, { props: { modelValue: "2026-10" }, attachTo: document.body });
    expect(w.find("input").exists()).toBe(true);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
    w.unmount();
  });

  it("点月格发出 yyyy-MM 串（focusedValue 继承 day，格式化只取年月）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ "onUpdate:modelValue": onUpdate });
    monthCell("10").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenCalledWith("2026-10");
    w.unmount();
  });

  it("外部赋值回显月格选中（data-selected）", async () => {
    await openPicker({ modelValue: "2026-03" });
    expect(monthCell("3").hasAttribute("data-selected")).toBe(true);
  });

  it("外部赋值回显到输入框（format 钩子路径）", () => {
    const w = mount(MonthPicker, { props: { modelValue: "2026-03" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("2026-03");
    w.unmount();
  });

  it("有值时清除按钮可点并发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(MonthPicker, {
      props: { modelValue: "2026-03", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(null));
    w.unmount();
  });

  it("空值时点击清除无多余 emit（值已为空，无 onChange）", async () => {
    const onUpdate = vi.fn();
    const w = mount(MonthPicker, {
      props: { "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("非法 modelValue（非补零/非数字）不崩且忽略", () => {
    const w = mount(MonthPicker, { props: { modelValue: "2026-3" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    const w2 = mount(MonthPicker, { props: { modelValue: "abc" }, attachTo: document.body });
    expect((w2.find("input").element as HTMLInputElement).value).toBe("");
    w.unmount();
    w2.unmount();
  });

  it("min 闭区间：min 当月可选、前一月禁用", async () => {
    await openPicker({ min: "2026-03" });
    expect(monthCell("3").hasAttribute("data-selectable")).toBe(true);
    expect(monthCell("2").hasAttribute("data-disabled")).toBe(true);
  });

  it("max 闭区间：max 当月可选、后一月禁用（当月末日换算路径）", async () => {
    await openPicker({ max: "2026-06" });
    expect(monthCell("6").hasAttribute("data-selectable")).toBe(true);
    expect(monthCell("7").hasAttribute("data-disabled")).toBe(true);
  });

  it("max 换算当月末日回归锁：无值打开（focusedValue=今天 day=12）+ max=当月 → 当月格可选", async () => {
    // 不换算时 max=2026-10-01，月格判定值 2026-10-12 > max → 误禁；换算后 2026-10-31 → 可选
    await openPicker({ max: "2026-10" });
    expect(monthCell("10").hasAttribute("data-selectable")).toBe(true);
  });

  it("closeOnSelect 默认选中后关弹层（emit update:open false）", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ modelValue: "2026-03", "onUpdate:open": onOpen });
    monthCell("5").click();
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("closeOnSelect=false 时选中后弹层不关", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({
      modelValue: "2026-03",
      closeOnSelect: false,
      "onUpdate:open": onOpen,
    });
    monthCell("5").click();
    await w.vm.$nextTick();
    expect(onOpen).not.toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("视图锁定：12 个月格、无日格、ViewTrigger 被 zag 钳制 disabled（mode 渲染裁剪 + Root min/maxView）", async () => {
    await openPicker();
    expect(
      document.body.querySelectorAll('[data-part="table-cell-trigger"][data-view="month"]').length,
    ).toBe(12);
    expect(
      document.body.querySelector('[data-part="table-cell-trigger"][data-view="day"]'),
    ).toBeNull();
    // v3：ViewTrigger 恒渲染（月分支包年份标题），锁定时 getNextView 无下级 → zag 原生 disabled
    const viewTrigger = document.body.querySelector<HTMLButtonElement>(
      '[data-part="view-trigger"]',
    );
    expect(viewTrigger, "锁定视图下 ViewTrigger 应存在（作标题）").toBeTruthy();
    expect(viewTrigger!.disabled, "钳制应来自 zag（原生 disabled）").toBe(true);
  });

  it("ViewControl prev/next 触发钮存在（月视图切年导航）", async () => {
    await openPicker();
    expect(document.body.querySelector('[data-part="prev-trigger"]')).toBeTruthy();
    expect(document.body.querySelector('[data-part="next-trigger"]')).toBeTruthy();
  });

  it("ViewControl 点 next 翻年：年份文本 +1（ViewControl 移入 View 修复锁）", async () => {
    const w = await openPicker({ modelValue: "2026-03" });
    // v3：年份标题由 ViewTrigger 承载（zag 钳制 disabled 后仍作标题显示）
    const yearLabel = () =>
      document
        .querySelector('[data-part="view-control"] [data-part="view-trigger"]')
        ?.textContent?.trim();
    expect(yearLabel(), "年份标题应显示当前年").toBe("2026");
    document.querySelector<HTMLElement>('[data-part="next-trigger"]')!.click();
    await w.vm.$nextTick();
    expect(yearLabel(), "next 应翻到下一年").toBe("2027");
    w.unmount();
  });

  it("手动键入合法月份后 Enter 提交 yyyy-MM（parse 钩子路径）", async () => {
    const onUpdate = vi.fn();
    const w = mount(MonthPicker, {
      props: { modelValue: "2026-01", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    // 键入须用 locale 分隔符（zh-CN 为 "/"，zag 会剥掉 "-"）；提交值仍为 yyyy-MM
    await input.setValue("2026/03");
    await input.trigger("keydown", { key: "Enter" });
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("2026-03"));
    w.unmount();
  });

  it("手动键入非法串被清洗且不产生脏值", async () => {
    const onUpdate = vi.fn();
    const w = mount(MonthPicker, {
      props: { modelValue: "2026-01", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    await input.setValue("abc");
    await vi.waitFor(() => expect((input.element as HTMLInputElement).value).toBe("2026-01"));
    expect(onUpdate).not.toHaveBeenCalledWith("abc");
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
    const w = mount(MonthPicker, { props: { "onUpdate:open": onOpen }, attachTo: document.body });
    const content = () => document.body.querySelector('[data-part="content"]');
    expect(content()?.getAttribute("data-state")).toBe("closed");
    await w.find("input").trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(content()?.getAttribute("data-state")).toBe("open"));
    expect(onOpen).toHaveBeenCalledWith(true);
    w.unmount();
  });

  it("disabled 禁用输入框与触发按钮", () => {
    const w = mount(MonthPicker, { props: { disabled: true }, attachTo: document.body });
    expect(w.find("input").attributes("disabled")).toBeDefined();
    expect(w.find('[data-part="trigger"]').attributes("disabled")).toBeDefined();
    w.unmount();
  });

  it("attrs 透传真实 input（id/aria-label）", () => {
    const w = mount(MonthPicker, {
      attrs: { id: "birth-month", "aria-label": "出生月份" },
      attachTo: document.body,
    });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("birth-month");
    expect(input.attributes("aria-label")).toBe("出生月份");
    w.unmount();
  });

  it("弹层内无嵌套 Content（embedded 形态确认）", async () => {
    await openPicker();
    expect(document.body.querySelectorAll('[data-part="content"]').length).toBe(1);
  });

  it("弹层 Portal 化：Positioner 直挂 body", async () => {
    await openPicker();
    const positioner = document.body.querySelector('[data-part="positioner"]');
    expect(positioner?.parentElement, "Positioner 应直挂 body").toBe(document.body);
  });
});
