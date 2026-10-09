import type { DateValue } from "@ark-ui/vue/date-picker";
import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DatePicker } from "./index";
import { formatIsoDate, parseIsoDate } from "./utils";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("parseIsoDate / formatIsoDate", () => {
  it("ISO 串 ↔ DateValue 往返", () => {
    const d = parseIsoDate("2026-10-09");
    expect(d).toBeDefined();
    expect(d!.year).toBe(2026);
    expect(d!.month).toBe(10);
    expect(d!.day).toBe(9);
    expect(formatIsoDate(d!)).toBe("2026-10-09");
  });

  it("非法/非严格 ISO 返回 undefined", () => {
    expect(parseIsoDate("")).toBeUndefined();
    expect(parseIsoDate("abc")).toBeUndefined();
    expect(parseIsoDate("2026-2-3")).toBeUndefined();
    expect(parseIsoDate("2026/10/09")).toBeUndefined();
  });
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

  it("zh-CN 默认周一起始（表头首列为「一」）", async () => {
    await openPicker({ modelValue: "2026-10-09" });
    const firstHeader = document.body.querySelector<HTMLElement>("[role='grid'] thead th");
    expect(firstHeader?.textContent).toContain("一");
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
});
