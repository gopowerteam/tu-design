import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Calendar } from "./index";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

/** standalone 直挂（无 Picker 宿主时组件自建 Root + 恒开弹层），等待格子挂载 */
async function openCalendar(props: Record<string, unknown> = {}) {
  const w = mount(Calendar, { props, attachTo: document.body });
  await vi.waitFor(() => {
    if (!document.body.querySelector('[data-scope="date-picker"] [role="grid"]')) {
      throw new Error("日历格子未挂载");
    }
  });
  return w;
}

describe("Calendar（standalone）", () => {
  it("自建 Root 且弹层恒开（Content data-state=open、无 hidden）", async () => {
    const w = await openCalendar();
    const content = document.body.querySelector('[data-part="content"]');
    expect(content).toBeTruthy();
    expect(content?.getAttribute("data-state")).toBe("open");
    expect(content?.hasAttribute("hidden")).toBe(false);
    w.unmount();
  });

  it("attrs class/id 落组件根 div（顶层 v-if/v-else 互斥单根继承；Ark Root 不透传故用自控壳承接）", async () => {
    const w = mount(Calendar, {
      attrs: { class: "rounded-md border", id: "x" },
      attachTo: document.body,
    });
    // attachTo 会包一层容器 div，w.element 非组件根；直接断言继承落点
    const host = document.body.querySelector<HTMLDivElement>("#x");
    expect(host, "attrs id 应继承到组件根 div").toBeTruthy();
    expect(host?.className).toContain("rounded-md");
    expect(host?.className).toContain("border");
    // 收缩包裹卡片宽度（否则块级撑满父容器，边框拉满整行）
    expect(host?.className).toContain("w-fit");
    w.unmount();
  });

  it("v-model：点格子发出 ISO 串", async () => {
    const onUpdate = vi.fn();
    const w = await openCalendar({ "onUpdate:modelValue": onUpdate });
    const cell = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-view="day"][data-value^="2026-10-"]',
    );
    expect(cell, "当月格子应存在").toBeTruthy();
    cell!.click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith(cell!.getAttribute("data-value"));
    w.unmount();
  });

  it("v-model：外部赋值回显选中（data-selected）", async () => {
    await openCalendar({ modelValue: "2026-10-09" });
    const selected = document.body.querySelector(
      '[data-part="table-cell-trigger"][data-view="day"][data-value="2026-10-09"][data-selected]',
    );
    expect(selected, "受控值格子应带 data-selected").toBeTruthy();
  });

  it("v-model：defaultValue 非受控种子，点选后翻转选中并 emit", async () => {
    const onUpdate = vi.fn();
    const w = await openCalendar({
      defaultValue: "2026-10-09",
      "onUpdate:modelValue": onUpdate,
    });
    expect(
      document.body.querySelector(
        '[data-part="table-cell-trigger"][data-view="day"][data-value="2026-10-09"][data-selected]',
      ),
    ).toBeTruthy();
    const cell = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-view="day"][data-value="2026-10-15"]',
    );
    cell!.click();
    await w.vm.$nextTick();
    expect(onUpdate).toHaveBeenLastCalledWith("2026-10-15");
    expect(
      document.body.querySelector(
        '[data-part="table-cell-trigger"][data-view="day"][data-value="2026-10-15"][data-selected]',
      ),
    ).toBeTruthy();
    w.unmount();
  });

  it("mode=day 渲染日网格与视图导航（标题加重 + 小圆角）", async () => {
    await openCalendar();
    expect(
      document.body.querySelectorAll('[data-part="table-cell-trigger"][data-view="day"]').length,
    ).toBeGreaterThan(0);
    expect(document.body.querySelector('[data-part="view-control"]')).toBeTruthy();
    const viewTrigger = document.body.querySelector('[data-part="view-trigger"]');
    expect(viewTrigger).toBeTruthy();
    // naive 对齐：标题 600 字重、主文字色、小圆角 hover 底
    expect(viewTrigger?.className).toContain("font-semibold");
    expect(viewTrigger?.className).toContain("text-foreground");
    expect(viewTrigger?.className).toContain("rounded-[3px]");
  });

  it("numOfMonths=2 渲染双月格子（getOffset 偏移月）", async () => {
    await openCalendar({ numOfMonths: 2 });
    const values = [
      ...document.body.querySelectorAll('[data-part="table-cell-trigger"][data-view="day"]'),
    ].map((el) => el.getAttribute("data-value") ?? "");
    expect(values.some((v) => v.startsWith("2026-10-"))).toBe(true);
    expect(values.some((v) => v.startsWith("2026-11-"))).toBe(true);
  });

  it("zh-CN 表头单字显示（一/二/三）+ 底部分隔线 + 宿主边框防御", async () => {
    await openCalendar();
    const headers = [...document.body.querySelectorAll("[role='grid'] thead th")];
    expect(headers[0]?.textContent?.trim()).toBe("一");
    for (const th of headers) {
      expect(th.textContent).not.toContain("周");
      // naive 对齐：星期行下方 1px 分隔线
      expect(th.className).toContain("border-b");
      // 宿主样式防御（VitePress .vp-doc th 四边边框污染）：只保留自绘底边
      expect(th.className).toContain("border-x-0!");
      expect(th.className).toContain("border-t-0!");
      // 宿主样式防御（.vp-doc th 文字对齐规则特异性压过 text-center）：important 居中，与日期列对齐
      expect(th.className).toContain("text-center!");
    }
    // 日期格子：清除宿主四边边框（格间竖线污染回归锁）
    const anyTd = document.body.querySelector("[role='grid'] tbody td");
    expect(anyTd?.className).toContain("border-0!");
  });

  it("宿主斑马线防御：表格行背景强制透明（VitePress tr:nth-child(2n) 污染回归锁）", async () => {
    await openCalendar({ numOfMonths: 2 });
    const rows = [...document.body.querySelectorAll("[role='grid'] tbody tr")];
    expect(rows.length).toBeGreaterThan(0);
    for (const tr of rows) {
      expect(tr.className).toContain("bg-transparent!");
    }
  });

  it("mode=month 渲染月网格（standalone 时 mode 派生视图锁定）", async () => {
    await openCalendar({ mode: "month" });
    const cells = document.body.querySelectorAll(
      '[data-part="table-cell-trigger"][data-view="month"]',
    );
    expect(cells.length).toBe(12);
    // v3：月分支 ViewTrigger 恒渲染（包年份标题），standalone mode 派生锁定 → zag 原生 disabled
    const viewTrigger = document.body.querySelector<HTMLButtonElement>(
      '[data-part="view-trigger"]',
    );
    expect(viewTrigger, "锁定月视图 ViewTrigger 应存在（作标题）").toBeTruthy();
    expect(viewTrigger!.disabled, "钳制应来自 zag（原生 disabled）").toBe(true);
    // 月/年视图单层格子沿用小圆角语言
    const monthTrigger = cells[0] as HTMLElement;
    expect(monthTrigger.className).toContain("rounded-[3px]");
    expect(monthTrigger.className).toContain("hover:bg-accent");
  });

  it("mode=year 渲染年网格", async () => {
    await openCalendar({ mode: "year" });
    expect(
      document.body.querySelectorAll('[data-part="table-cell-trigger"][data-view="year"]').length,
    ).toBeGreaterThan(0);
  });

  it("standalone 月卡：next 翻年且年份文本更新（ViewControl 移入 View 修复锁）", async () => {
    const w = await openCalendar({ mode: "month", modelValue: "2026-03" });
    // v3：年份标题由 ViewTrigger 承载
    const yearLabel = () =>
      document.body
        .querySelector('[data-part="view-control"] [data-part="view-trigger"]')
        ?.textContent?.trim();
    expect(yearLabel(), "月份标题应显示年份").toBe("2026");
    document.body.querySelector<HTMLElement>('[data-part="next-trigger"]')!.click();
    await w.vm.$nextTick();
    expect(yearLabel(), "next 应翻到下一年").toBe("2027");
    w.unmount();
  });

  it("standalone 年卡：年代标题存在，next 翻年代（ViewControl 移入 View 修复锁）", async () => {
    const w = await openCalendar({ mode: "year", modelValue: "2026" });
    const decadeLabel = () =>
      document.body.querySelector('[data-part="view-control"] span')?.textContent?.trim();
    expect(decadeLabel(), "年代标题应显示当前年代").toBe("2020 - 2029");
    document.body.querySelector<HTMLElement>('[data-part="next-trigger"]')!.click();
    await w.vm.$nextTick();
    expect(decadeLabel(), "next 应翻到下一年代").toBe("2030 - 2039");
    w.unmount();
  });

  it("卡片宽度与内边距随 numOfMonths 切换（打磨后规格）", async () => {
    const single = await openCalendar();
    const singleCard = document.body.querySelector('[data-part="content"] > div');
    expect(singleCard?.className).toContain("w-80");
    expect(singleCard?.className).toContain("p-4");
    single.unmount();

    const multi = await openCalendar({ numOfMonths: 2 });
    const multiCard = document.body.querySelector('[data-part="content"] > div');
    expect(multiCard?.className).toContain("w-[40rem]");
    multi.unmount();
  });

  it("日视图双层格子：trigger 全格命中+range 条带，视觉色移交 dot 层（naive 对齐）", async () => {
    await openCalendar({
      numOfMonths: 2,
      isDateUnavailable: (d: { day: number }) => d.day === 15,
    });
    const anyTrigger = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-view="day"]',
    );
    // 命中区：全格、紧凑高度、group 作用域；hover 底色不在 trigger
    expect(anyTrigger?.className).toContain("group");
    expect(anyTrigger?.className).toContain("h-8");
    expect(anyTrigger?.className).toContain("w-full");
    expect(anyTrigger?.className).not.toContain("hover:bg-accent");
    // range 条带层在 trigger 全格（primary/10 无缝）；排除本表月份外的补位格
    expect(anyTrigger?.className).toContain(
      "data-[in-range]:not-data-[outside-view]:not-data-[range-start]:not-data-[range-end]:bg-primary/10",
    );
    // 视觉层：24px 小圆点 span，hover/选中/today 色经 group-* 读取
    const dot = anyTrigger?.firstElementChild as HTMLElement | null;
    expect(dot?.tagName).toBe("SPAN");
    expect(dot?.className).toContain("size-6");
    expect(dot?.className).toContain("rounded-[3px]");
    expect(dot?.className).toContain("group-hover:bg-accent");
    expect(dot?.className).toContain(
      "group-data-[selected]:not-group-data-[outside-view]:bg-primary",
    );
    expect(dot?.className).toContain("group-data-[focus]:not-group-data-[outside-view]:bg-accent");
    expect(dot?.className).toContain("not-group-data-[selected]:text-primary");
    // 行界圆角（naive 7n+1/7n+7）：首行首格左圆角、首行尾格右圆角
    const triggers = [
      ...document.body.querySelectorAll<HTMLElement>(
        '[data-part="table-cell-trigger"][data-view="day"]',
      ),
    ];
    expect(triggers.length).toBeGreaterThanOrEqual(7);
    expect(triggers[0]?.className).toContain("rounded-l-[3px]");
    expect(triggers[6]?.className).toContain("rounded-r-[3px]");
    // 相邻月补位格自标记：zag 的 outside-range 是整机可见范围语义，覆盖不了
    // 「相邻月表内的补位格」（如双月右表首行的上月尾），Card 按锚点月自行标注
    const outsideViewCells = document.body.querySelectorAll(
      '[data-part="table-cell-trigger"][data-view="day"][data-outside-view]',
    );
    expect(outsideViewCells.length).toBeGreaterThanOrEqual(3);
    // 补位格不可选（naive excluded 语义）：pointer-events-none 仅作日期连续性视觉提示
    // （类串是静态规则，逐格生效由 CSS 变体承担；真实点击行为在浏览器实测验证）
    expect(anyTrigger?.className).toContain("data-[outside-view]:pointer-events-none");
    // today/unavailable 语义在 dot 层；月外灰化由 outside-view 承接
    //（zag getDayTableCellState 的 getUnitDuration 强制置 1，numOfMonths>1 时右表当月格
    //  也带伪 data-outside-range，不作样式依据）
    const todayDot = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-today] span',
    );
    expect(todayDot?.className).toContain("not-group-data-[selected]:text-primary");
    const unavailableDot = document.body.querySelector<HTMLElement>(
      '[data-part="table-cell-trigger"][data-unavailable] span',
    );
    expect(unavailableDot?.className).toContain("group-data-[unavailable]:line-through");
    expect(dot?.className).not.toContain("group-data-[outside-range]:opacity-30");
    expect(dot?.className).toContain("group-data-[outside-view]:opacity-30");
  });
});
