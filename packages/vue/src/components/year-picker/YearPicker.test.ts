import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { YearPicker } from "./index";

// 日期硬编码 2026（年代推进时与日期家族套件统一调整）。
// Y10 机制出处：zag 年格 disabled 只比 min?.year/max?.year（connect isValueWithinRange），
// 无换算依赖；focusedValue 初始=今天（无值时 machine.mjs 初始链）→ 年代 2020-2029。
afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("YearPicker", () => {
  /** 受控 open 挂载并等待年格挂到 body（portal） */
  async function openPicker(props: Record<string, unknown> = {}) {
    const w = mount(YearPicker, { props: { open: true, ...props }, attachTo: document.body });
    await vi.waitFor(() => {
      if (
        !document.body.querySelector(
          '[data-scope="date-picker"] [data-part="table-cell-trigger"][data-view="year"]',
        )
      ) {
        throw new Error("年格未挂载");
      }
    });
    return w;
  }

  function yearCell(value: string): HTMLElement {
    const el = document.body.querySelector<HTMLElement>(
      `[data-part="table-cell-trigger"][data-view="year"][data-value="${value}"]`,
    );
    expect(el, `年格 ${value} 应存在`).toBeTruthy();
    return el!;
  }

  it("渲染输入框、触发按钮与清除按钮", () => {
    const w = mount(YearPicker, { props: { modelValue: "2026" }, attachTo: document.body });
    expect(w.find("input").exists()).toBe(true);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
    w.unmount();
  });

  it("点年格发出 yyyy 串（focusedValue.set({year}) 格式化只取年）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ "onUpdate:modelValue": onUpdate });
    yearCell("2026").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenCalledWith("2026");
    w.unmount();
  });

  it("外部赋值回显年格选中（data-selected）", async () => {
    await openPicker({ modelValue: "2024" });
    expect(yearCell("2024").hasAttribute("data-selected")).toBe(true);
  });

  it("外部赋值回显到输入框（format 钩子路径）", () => {
    const w = mount(YearPicker, { props: { modelValue: "2024" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("2024");
    w.unmount();
  });

  it("有值时清除按钮可点并发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(YearPicker, {
      props: { modelValue: "2024", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(null));
    w.unmount();
  });

  it("空值时点击清除无多余 emit（值已为空，无 onChange）", async () => {
    const onUpdate = vi.fn();
    const w = mount(YearPicker, {
      props: { "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("非法 modelValue（非四位/非数字）不崩且忽略", () => {
    const w = mount(YearPicker, { props: { modelValue: "202" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    const w2 = mount(YearPicker, { props: { modelValue: "abc" }, attachTo: document.body });
    expect((w2.find("input").element as HTMLInputElement).value).toBe("");
    w.unmount();
    w2.unmount();
  });

  it("min 闭区间：min 当年可选、前一年禁用", async () => {
    await openPicker({ min: "2021" });
    expect(yearCell("2021").hasAttribute("data-selectable")).toBe(true);
    expect(yearCell("2020").hasAttribute("data-disabled")).toBe(true);
  });

  it("max 闭区间：max 当年可选、后一年禁用", async () => {
    await openPicker({ max: "2026" });
    expect(yearCell("2026").hasAttribute("data-selectable")).toBe(true);
    expect(yearCell("2027").hasAttribute("data-disabled")).toBe(true);
  });

  it("max 当年代最晚年可选（年格纯年粒度判定，无换算依赖回归锁）", async () => {
    await openPicker({ max: "2026" });
    // focusedValue=今天(2026-10-12) → 年代 2020-2029；2026 是 max 年，可选
    expect(yearCell("2026").hasAttribute("data-selectable")).toBe(true);
  });

  it("closeOnSelect 默认选中后关弹层（emit update:open false）", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ modelValue: "2024", "onUpdate:open": onOpen });
    yearCell("2025").click();
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("closeOnSelect=false 时选中后弹层不关", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({
      modelValue: "2024",
      closeOnSelect: false,
      "onUpdate:open": onOpen,
    });
    yearCell("2025").click();
    await w.vm.$nextTick();
    expect(onOpen).not.toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("视图锁定：10 个年格（一个年代）、无日格、无 ViewTrigger", async () => {
    await openPicker();
    expect(
      document.body.querySelectorAll('[data-part="table-cell-trigger"][data-view="year"]').length,
    ).toBe(10);
    expect(
      document.body.querySelector('[data-part="table-cell-trigger"][data-view="day"]'),
    ).toBeNull();
    expect(document.body.querySelector('[data-part="view-trigger"]')).toBeNull();
  });

  it("ViewControl prev/next 触发钮存在（年视图切年代导航）", async () => {
    await openPicker();
    expect(document.body.querySelector('[data-part="prev-trigger"]')).toBeTruthy();
    expect(document.body.querySelector('[data-part="next-trigger"]')).toBeTruthy();
  });

  it("手动键入合法年份后 Enter 提交 yyyy（parse 钩子路径）", async () => {
    const onUpdate = vi.fn();
    const w = mount(YearPicker, {
      props: { modelValue: "2024", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    await input.setValue("2028");
    await input.trigger("keydown", { key: "Enter" });
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("2028"));
    w.unmount();
  });

  it("手动键入非法串被清洗且不产生脏值", async () => {
    const onUpdate = vi.fn();
    const w = mount(YearPicker, {
      props: { modelValue: "2024", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    await input.setValue("abc");
    await vi.waitFor(() => expect((input.element as HTMLInputElement).value).toBe("2024"));
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
    const w = mount(YearPicker, { props: { "onUpdate:open": onOpen }, attachTo: document.body });
    const content = () => document.body.querySelector('[data-part="content"]');
    expect(content()?.getAttribute("data-state")).toBe("closed");
    await w.find("input").trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(content()?.getAttribute("data-state")).toBe("open"));
    expect(onOpen).toHaveBeenCalledWith(true);
    w.unmount();
  });

  it("disabled 禁用输入框与触发按钮", () => {
    const w = mount(YearPicker, { props: { disabled: true }, attachTo: document.body });
    expect(w.find("input").attributes("disabled")).toBeDefined();
    expect(w.find('[data-part="trigger"]').attributes("disabled")).toBeDefined();
    w.unmount();
  });

  it("attrs 透传真实 input（id/aria-label）", () => {
    const w = mount(YearPicker, {
      attrs: { id: "fiscal-year", "aria-label": "财年" },
      attachTo: document.body,
    });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("fiscal-year");
    expect(input.attributes("aria-label")).toBe("财年");
    w.unmount();
  });

  it("弹层内无嵌套 Content（embedded 形态确认）", async () => {
    await openPicker();
    expect(document.body.querySelectorAll('[data-part="content"]').length).toBe(1);
  });

  it("ViewControl 点 next/prev 翻年代：标题与年格同步更新（ViewControl 移入 View 修复锁）", async () => {
    const w = await openPicker({ modelValue: "2026" });
    const decadeLabel = () =>
      document.querySelector('[data-part="view-control"] span')?.textContent?.trim();
    expect(decadeLabel(), "年代标题应显示当前年代").toBe("2020 - 2029");
    document.querySelector<HTMLElement>('[data-part="next-trigger"]')!.click();
    await w.vm.$nextTick();
    expect(decadeLabel(), "next 应翻到下一年代").toBe("2030 - 2039");
    expect(yearCell("2030"), "翻页后新年代格应出现").toBeTruthy();
    document.querySelector<HTMLElement>('[data-part="prev-trigger"]')!.click();
    await w.vm.$nextTick();
    expect(decadeLabel(), "prev 应翻回原年代").toBe("2020 - 2029");
    w.unmount();
  });

  it("弹层 Portal 化：Positioner 直挂 body", async () => {
    await openPicker();
    const positioner = document.body.querySelector('[data-part="positioner"]');
    expect(positioner?.parentElement, "Positioner 应直挂 body").toBe(document.body);
  });
});
