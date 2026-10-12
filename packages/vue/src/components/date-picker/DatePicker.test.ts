import type { DateValue } from "@ark-ui/vue/date-picker";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { formatIsoDate, parseIsoDate } from "../date-shared/shared";
import { DatePicker } from "./index";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DatePicker", () => {
  /** 受控 open 挂载并等待弹层内容挂到 body（portal） */
  async function openPicker(props: Record<string, unknown> = {}) {
    const w = mount(DatePicker, { props: { open: true, ...props }, attachTo: document.body });
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
    const w = mount(DatePicker, { props: { modelValue: "2026-10-09" }, attachTo: document.body });
    expect(w.find("input").exists()).toBe(true);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
    w.unmount();
  });

  it("点格子发出 ISO 串（modelValue 锚定当月视图）", async () => {
    const onUpdate = vi.fn();
    const w = await openPicker({ modelValue: "2026-10-09", "onUpdate:modelValue": onUpdate });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-15");
    w.unmount();
  });

  it("外部赋值回显到输入框（默认 ISO format）", () => {
    const w = mount(DatePicker, { props: { modelValue: "2026-10-09" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("2026-10-09");
    w.unmount();
  });

  it("有值时清除按钮可点并发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find('[data-part="clear-trigger"]').trigger("click");
    expect(onUpdate).toHaveBeenLastCalledWith(null);
    w.unmount();
  });

  it("空值时点击清除无多余 emit（值已为空，无 onChange）", async () => {
    const onUpdate = vi.fn();
    const w = mount(DatePicker, {
      props: { modelValue: null, "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    await w.find('[data-part="clear-trigger"]').trigger("click");
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("min 边界外格子不可选", async () => {
    await openPicker({ modelValue: "2026-10-09", min: "2026-10-10" });
    const before = cell("2026-10-05");
    expect(
      before.hasAttribute("data-disabled") || before.getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  it("isDateUnavailable 命中格子不可选", async () => {
    await openPicker({
      modelValue: "2026-10-09",
      isDateUnavailable: (d: DateValue) => d.day === 15,
    });
    const unavailable = cell("2026-10-15");
    expect(
      unavailable.hasAttribute("data-disabled") ||
        unavailable.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    const available = cell("2026-10-16");
    expect(
      available.hasAttribute("data-disabled") || available.getAttribute("aria-disabled") === "true",
    ).toBe(false);
  });

  it("closeOnSelect=false 时选中后弹层不关", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({
      modelValue: "2026-10-09",
      closeOnSelect: false,
      "onUpdate:open": onOpen,
    });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onOpen).not.toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("closeOnSelect 默认选中后关弹层", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ modelValue: "2026-10-09", "onUpdate:open": onOpen });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("zh-CN 默认周一起始，表头单字显示（一/二/三，非周一/周二）", async () => {
    await openPicker({ modelValue: "2026-10-09" });
    const headers = [...document.body.querySelectorAll("[role='grid'] thead th")];
    expect(headers[0]?.textContent?.trim()).toBe("一");
    for (const th of headers) {
      expect(th.textContent).not.toContain("周");
      expect(th.textContent!.length).toBeLessThanOrEqual(1);
    }
  });

  it("受控 open 时 Esc 关闭发出 update:open false", async () => {
    const onOpen = vi.fn();
    const w = await openPicker({ "onUpdate:open": onOpen });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await w.vm.$nextTick();
    expect(onOpen).toHaveBeenCalledWith(false);
    w.unmount();
  });

  it("非受控：点触发按钮开弹层", async () => {
    const w = mount(DatePicker, { attachTo: document.body });
    await w.find('[data-part="trigger"]').trigger("click");
    await vi.waitFor(() =>
      expect(document.body.querySelector('[data-scope="date-picker"]')).toBeTruthy(),
    );
    w.unmount();
  });

  it("非受控：点击输入框也打开弹层", async () => {
    const w = mount(DatePicker, { attachTo: document.body });
    // zag 的 Content 恒挂载（closed 时 hidden），以 data-state 断言开合
    const content = () => document.body.querySelector('[data-part="content"]');
    expect(content()?.getAttribute("data-state")).toBe("closed");
    await w.find("input").trigger("click");
    await vi.waitFor(() => expect(content()?.getAttribute("data-state")).toBe("open"));
    w.unmount();
  });

  it("readOnly 时点击输入框不打开弹层", async () => {
    const w = mount(DatePicker, { props: { readOnly: true }, attachTo: document.body });
    await w.find("input").trigger("click");
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(document.body.querySelector('[data-part="content"]')?.getAttribute("data-state")).toBe(
      "closed",
    );
    w.unmount();
  });

  it("日历表格走原生 table 布局：table-fixed 均分列、行不 flex 化", async () => {
    const w = await openPicker();
    const table = document.body.querySelector('[data-scope="date-picker"] table');
    expect(table?.className).toContain("table-fixed");
    expect(table?.className).toContain("border-collapse");
    document.body.querySelectorAll('[data-scope="date-picker"] tr').forEach((tr) => {
      expect(tr.className).not.toContain("flex");
    });
    document.body
      .querySelectorAll('[data-scope="date-picker"] [data-part="table-cell-trigger"]')
      .forEach((el) => {
        expect(el.className).not.toContain("rounded");
      });
    w.unmount();
  });

  it("格子触发器撑满整格（w-full）：选中/hover 背景无露缝", async () => {
    const w = await openPicker();
    document.body
      .querySelectorAll('[data-scope="date-picker"] [data-part="table-cell-trigger"]')
      .forEach((el) => {
        expect(el.className).toContain("w-full");
        expect(el.className).not.toContain("w-8");
      });
    w.unmount();
  });

  it("表头/格子带宿主样式防御：important 重置 padding、表头不折行（VitePress .vp-doc th 污染回归锁）", async () => {
    const w = await openPicker();
    const th = document.body.querySelector('[data-scope="date-picker"] th');
    expect(th?.className).toContain("p-0!");
    expect(th?.className).toContain("text-xs!");
    expect(th?.className).toContain("whitespace-nowrap");
    document.body.querySelectorAll('[data-scope="date-picker"] td').forEach((td) => {
      expect(td.className).toContain("p-0!");
    });
    w.unmount();
  });

  it("disabled 禁用输入框与触发按钮", () => {
    const w = mount(DatePicker, { props: { disabled: true }, attachTo: document.body });
    expect(w.find("input").attributes("disabled")).toBeDefined();
    expect(w.find('[data-part="trigger"]').attributes("disabled")).toBeDefined();
    w.unmount();
  });

  it("attrs 透传真实 input（id/aria-label）", () => {
    const w = mount(DatePicker, {
      attrs: { id: "dob", "aria-label": "出生日期" },
      attachTo: document.body,
    });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("dob");
    expect(input.attributes("aria-label")).toBe("出生日期");
    w.unmount();
  });

  it("非受控 defaultValue 点选后输入框回显", async () => {
    const w = await openPicker({ defaultValue: "2026-10-09" });
    cell("2026-10-15").click();
    await w.vm.$nextTick();
    expect((w.find("input").element as HTMLInputElement).value).toBe("2026-10-15");
    w.unmount();
  });

  it("非法 modelValue 不崩且忽略", () => {
    const w = mount(DatePicker, { props: { modelValue: "abc" }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    w.unmount();
  });

  it("键盘 ArrowDown 聚焦输入框可打开弹层并 emit update:open true", async () => {
    const onOpen = vi.fn();
    const w = mount(DatePicker, { props: { "onUpdate:open": onOpen }, attachTo: document.body });
    const content = () => document.body.querySelector('[data-part="content"]');
    expect(content()?.getAttribute("data-state")).toBe("closed");
    await w.find("input").trigger("keydown", { key: "ArrowDown" });
    await vi.waitFor(() => expect(content()?.getAttribute("data-state")).toBe("open"));
    expect(onOpen).toHaveBeenCalledWith(true);
    w.unmount();
  });

  it("手动键入合法日期后 Enter 提交 ISO 值（parse 钩子路径）", async () => {
    const onUpdate = vi.fn();
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    // 键入须用 locale 分隔符（zh-CN 为 "/"，zag 会剥掉 "-"）；提交值仍为 ISO
    await input.setValue("2026/10/20");
    await input.trigger("keydown", { key: "Enter" });
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("2026-10-20"));
    w.unmount();
  });

  it("手动键入非法串被清洗且不产生脏值", async () => {
    const onUpdate = vi.fn();
    const w = mount(DatePicker, {
      props: { modelValue: "2026-10-09", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    const input = w.find("input");
    await input.setValue("abc");
    // zag INPUT.CHANGE 清洗后同步输入框回显选中值，不等待 blur
    await vi.waitFor(() => expect((input.element as HTMLInputElement).value).toBe("2026-10-09"));
    expect(onUpdate).not.toHaveBeenCalledWith("abc");
    w.unmount();
  });

  it("max 边界外格子不可选", async () => {
    const w = await openPicker({ modelValue: "2026-10-09", max: "2026-10-10" });
    const after = cell("2026-10-15");
    expect(
      after.hasAttribute("data-disabled") || after.getAttribute("aria-disabled") === "true",
    ).toBe(true);
    w.unmount();
  });

  it("ViewTrigger 点击切换月视图：12 个月格子、value 为月份数字", async () => {
    const w = await openPicker({ modelValue: "2026-10-09" });
    const viewTrigger = document.body.querySelector<HTMLElement>('[data-part="view-trigger"]');
    expect(viewTrigger, "视图切换按钮应存在").toBeTruthy();
    viewTrigger!.click();
    await vi.waitFor(() => {
      const cells = document.body.querySelectorAll(
        '[data-part="table-cell-trigger"][data-view="month"]',
      );
      if (cells.length !== 12) throw new Error("月视图格子未挂载");
    });
    const oct = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-view="month"][data-value="10"]',
    );
    expect(oct, "10 月格子应存在（value 为月份数字）").toBeTruthy();
    w.unmount();
  });
});
