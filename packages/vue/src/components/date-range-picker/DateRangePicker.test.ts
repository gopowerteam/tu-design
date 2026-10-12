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

  it("渲染输入框、触发按钮与清除按钮", () => {
    const w = mount(DateRangePicker, {
      props: { modelValue: ["2026-10-09", "2026-10-15"] },
      attachTo: document.body,
    });
    expect(w.find("input").exists()).toBe(true);
    expect(w.find('[data-part="trigger"]').exists()).toBe(true);
    expect(w.find('[data-part="clear-trigger"]').exists()).toBe(true);
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

  it("attrs 透传真实 input（id/aria-label）", () => {
    const w = mount(DateRangePicker, {
      attrs: { id: "range", "aria-label": "起止日期" },
      attachTo: document.body,
    });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("range");
    expect(input.attributes("aria-label")).toBe("起止日期");
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

  it("range 样式：区间中段格子带 data-in-range 且样式含 accent 变体", async () => {
    await openPicker({ modelValue: ["2026-10-01", "2026-10-10"] });
    const middle = cell("2026-10-05");
    expect(middle.hasAttribute("data-in-range")).toBe(true);
    expect(middle.className).toContain("data-[in-range]:bg-accent/50");
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
});
