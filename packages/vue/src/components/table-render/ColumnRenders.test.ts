import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { columnRenders } from "./column-renders";
import { defineTable } from "./define-table";
import TableRender from "./TableRender.vue";

interface Order {
  id: number;
  status: string;
  createdAt: Date;
  amount: number;
}

const ORDER: Order = {
  id: 1,
  status: "paid",
  createdAt: new Date(2026, 0, 15, 9, 5, 3),
  amount: 1234.5,
};

describe("columnRenders", () => {
  // ---------- dict ----------
  it("dict：命中映射渲染 label，未命中显示原始值", () => {
    const r = columnRenders<Order>();
    const cell = r.dict({ paid: "已付款", pending: "待付款" })(ORDER, 0, {
      key: "status",
      title: "状态",
    });
    expect(cell).toBe("已付款");

    const unknown = r.dict({ paid: "已付款" })({ ...ORDER, status: "closed" }, 0, {
      key: "status",
      title: "状态",
    });
    expect(unknown).toBe("closed");

    // null/undefined → 空字符串（文档承诺的兜底语义）
    const blank = r.dict({ paid: "已付款" })({ ...ORDER, status: null as unknown as string }, 0, {
      key: "status",
      title: "状态",
    });
    expect(blank).toBe("");
  });

  it("dict：条目带 variant 渲染 Badge，options.badge 整列生效", () => {
    const r = columnRenders<Order>();
    const status = { key: "status", title: "状态" };
    const wrapper = mount({
      setup() {
        return () =>
          h("div", [
            // 条目级 variant → Badge
            r.dict({ paid: { label: "已付款", variant: "outline" } })(ORDER, 0, status),
            // 整列 badge → Badge
            r.dict({ paid: "已付款" }, { badge: true })(ORDER, 0, status),
            // 无 variant 且未开 badge → 纯文本
            r.dict({ paid: "已付款" })(ORDER, 0, status),
          ]);
      },
    });
    expect(wrapper.findAll("span[class*='rounded-md']")).toHaveLength(2);
  });

  // ---------- date ----------
  it("date：默认 yyyy-MM-dd，支持令牌与补零，非法输入原样显示", () => {
    const r = columnRenders<Order>();
    expect(r.date()(ORDER, 0, { key: "createdAt", title: "日期" })).toBe("2026-01-15");
    expect(r.date("yyyy-MM-dd HH:mm:ss")(ORDER, 0, { key: "createdAt", title: "日期" })).toBe(
      "2026-01-15 09:05:03",
    );

    const invalid = r.date()({ ...ORDER, createdAt: "不是日期" as unknown as Date }, 0, {
      key: "createdAt",
      title: "日期",
    });
    expect(invalid).toBe("不是日期");
  });

  it("date：接受时间戳与 ISO 字符串", () => {
    const r = columnRenders<Order>();
    const stamp = r.date()(
      { ...ORDER, createdAt: new Date(2026, 0, 15, 12).getTime() as unknown as Date },
      0,
      {
        key: "createdAt",
        title: "日期",
      },
    );
    const iso = r.date()({ ...ORDER, createdAt: "2026-01-15T00:00:00" as unknown as Date }, 0, {
      key: "createdAt",
      title: "日期",
    });
    expect(stamp).toBe(iso);
  });

  // ---------- currency ----------
  it("currency：默认 CNY 中文数字格式，NaN 原样显示", () => {
    const r = columnRenders<Order>();
    expect(r.currency()(ORDER, 0, { key: "amount", title: "金额" })).toBe("¥1,234.50");

    const invalid = r.currency()({ ...ORDER, amount: Number.NaN }, 0, {
      key: "amount",
      title: "金额",
    });
    expect(invalid).toBeNaN();
  });

  it("currency：自定义币种与 locale", () => {
    const r = columnRenders<Order>();
    expect(r.currency("USD", "en-US")(ORDER, 0, { key: "amount", title: "金额" })).toBe(
      "$1,234.50",
    );
  });

  // ---------- serial ----------
  it("serial：默认从 1 起，base 生效", () => {
    const r = columnRenders<Order>();
    const noop = { key: "id", title: "#" };
    expect(r.serial()(ORDER, 0, noop)).toBe(1);
    expect(r.serial()(ORDER, 4, noop)).toBe(5);
    expect(r.serial(10)(ORDER, 0, noop)).toBe(10);
  });

  // ---------- button ----------
  it("button：字符串简写渲染文本，onClick 收到 (record, index)", async () => {
    const r = columnRenders<Order>();
    const clicks: Array<[Order, number]> = [];
    const cell = r.button([{ text: "编辑", onClick: (rec, i) => clicks.push([rec, i]) }, "删除"])(
      ORDER,
      2,
      { key: "ops", title: "操作" },
    );

    const wrapper = mount({ setup: () => () => h("div", [cell as never]) });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.text()).toBe("编辑");
    expect(buttons[1]!.text()).toBe("删除");

    await buttons[0]!.trigger("click");
    expect(clicks).toEqual([[ORDER, 2]]);
  });

  it("button：text 支持函数，disabled 函数生效", async () => {
    const r = columnRenders<Order>();
    const cell = r.button([{ text: (rec) => `编辑${rec.id}`, disabled: () => true }])(ORDER, 0, {
      key: "ops",
      title: "操作",
    });

    const wrapper = mount({ setup: () => () => h("div", [cell as never]) });
    const button = wrapper.find("button");
    expect(button.text()).toBe("编辑1");
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("button：空数组不渲染节点", () => {
    const r = columnRenders<Order>();
    expect(r.button([])(ORDER, 0, { key: "ops", title: "操作" })).toBe("");
  });

  // ---------- 集成 ----------
  it("集成：经 defineTable 列配置在 TableRender 中真实渲染", async () => {
    const box: { def?: ReturnType<typeof defineTable<Order>> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Order>({
          data: [ORDER],
          columns: [
            { key: "status", title: "状态", render: (r) => r.dict({ paid: "已付款" }) },
            { key: "createdAt", title: "日期", render: (r) => r.date("yyyy/MM/dd") },
            { key: "amount", title: "金额", render: (r) => r.currency("CNY") },
            { key: "x", title: "#", render: (r) => r.serial() },
            { key: "ops", title: "操作", render: (r) => r.button([{ text: "编辑" }, "删除"]) },
          ],
        });
        return () => h(TableRender, { definition: box.def, rowKey: "id" });
      },
    });

    const wrapper = mount(Host, { attachTo: document.body });
    await Promise.resolve();
    const cells = wrapper.findAll("tbody tr").at(0)!.findAll("td");
    expect(cells[0]!.text()).toBe("已付款");
    expect(cells[1]!.text()).toBe("2026/01/15");
    expect(cells[2]!.text()).toBe("¥1,234.50");
    expect(cells[3]!.text()).toBe("1");
    expect(cells[4]!.findAll("button").map((b) => b.text())).toEqual(["编辑", "删除"]);
    wrapper.unmount();
  });
});

// ---------- button confirm（二次确认，复用 Popconfirm） ----------

const popoverContent = () =>
  document.querySelector<HTMLElement>('[data-scope="popover"][data-part="content"]');

/** 面板内按钮按文案查找（面板经 Teleport 挂到 body；限定面板内，避免误命中同文案触发按钮） */
function findPanelButton(text: string) {
  return [...(popoverContent()?.querySelectorAll("button") ?? [])].find((b) =>
    b.textContent?.includes(text),
  );
}

/** 可手动落定的 Promise，驱动异步确认的 pending/resolve/reject 时序 */
function deferred() {
  let resolve!: () => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("columnRenders button confirm", () => {
  const OPS = { key: "ops", title: "操作" };
  let wrapper: ReturnType<typeof mount> | undefined;

  /** 挂载单元格渲染结果（attachTo body：Popconfirm 面板 Teleport 需要真实文档） */
  function mountCell(cell: unknown) {
    wrapper = mount({ setup: () => () => h("div", [cell as never]) }, { attachTo: document.body });
    return wrapper;
  }

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());
  });

  it("字符串简写 = 气泡标题；点击触发按钮不执行 onClick（仅开气泡）", async () => {
    const onClick = vi.fn();
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([{ text: "删除", onClick, confirm: "确定删除该记录？" }])(ORDER, 2, OPS),
    );

    const trigger = w.find("button[data-part='trigger']");
    expect(trigger.text()).toBe("删除");
    await trigger.trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));
    expect(popoverContent()!.textContent).toContain("确定删除该记录？");
    // S1 回归锁：触发点击只开气泡，onClick 不执行
    expect(onClick).not.toHaveBeenCalled();
  });

  it("点「确定」执行 onClick(record, index) 并关闭气泡", async () => {
    const clicks: Array<[Order, number]> = [];
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([
        { text: "删除", onClick: (rec, i) => clicks.push([rec, i]), confirm: "确定删除？" },
      ])(ORDER, 2, OPS),
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    findPanelButton("确定")!.click();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("closed"));
    expect(clicks).toEqual([[ORDER, 2]]);
  });

  it("点「取消」不执行 onClick，气泡关闭", async () => {
    const onClick = vi.fn();
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([{ text: "删除", onClick, confirm: "确定删除？" }])(ORDER, 0, OPS),
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    findPanelButton("取消")!.click();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("closed"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("异步 onClick：pending 锁定双钮，resolve 自动关闭；reject 保持打开可重试", async () => {
    const d = deferred();
    let calls = 0;
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([
        {
          text: "删除",
          onClick: () => (calls++ === 0 ? d.promise : Promise.resolve()),
          confirm: "确定删除？",
        },
      ])(ORDER, 0, OPS),
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    findPanelButton("确定")!.click();
    await vi.waitFor(() => expect(findPanelButton("确定")!.disabled).toBe(true));
    expect(document.querySelector('[data-scope="popover"] svg.animate-spin')).toBeTruthy();
    expect(findPanelButton("取消")!.disabled).toBe(true);

    // reject：退出 loading、气泡保持打开
    d.reject(new Error("failed"));
    await vi.waitFor(() => expect(findPanelButton("确定")!.disabled).toBe(false));
    expect(popoverContent()!.dataset.state).toBe("open");

    // 重试（第二次返回 resolved Promise）：自动关闭
    findPanelButton("确定")!.click();
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("closed"));
    expect(calls).toBe(2);
  });

  it("对象形态：description/confirmText/cancelText/variant 生效，函数 title/description 按行求值", async () => {
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([
        {
          text: "删除",
          confirm: {
            title: (rec) => `删除记录 ${rec.id}？`,
            description: (rec, i) => `行 ${i} 状态 ${rec.status}，删除后不可恢复`,
            confirmText: "删除",
            cancelText: "再想想",
            variant: "destructive",
          },
        },
      ])(ORDER, 3, OPS),
    );
    await w.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));

    const panel = popoverContent()!;
    expect(panel.textContent).toContain("删除记录 1？");
    expect(panel.textContent).toContain("行 3 状态 paid，删除后不可恢复");
    expect(findPanelButton("再想想")).toBeTruthy();
    expect(findPanelButton("删除")!.className).toContain("bg-destructive");
  });

  it("variant 推断：destructive 按钮 → 红色确认钮；显式 confirm.variant 优先", async () => {
    const r = columnRenders<Order>();
    const w1 = mountCell(
      r.button([{ text: "删除", variant: "destructive", confirm: "确定删除？" }])(ORDER, 0, OPS),
    );
    await w1.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));
    expect(findPanelButton("确定")!.className).toContain("bg-destructive");
    w1.unmount();
    wrapper = undefined;
    document.body.querySelectorAll('[data-scope="popover"]').forEach((n) => n.remove());

    const w2 = mountCell(
      r.button([
        {
          text: "删除",
          variant: "destructive",
          confirm: { title: "确定删除？", variant: "default" },
        },
      ])(ORDER, 0, OPS),
    );
    await w2.find("button[data-part='trigger']").trigger("click");
    await vi.waitFor(() => expect(popoverContent()?.dataset.state).toBe("open"));
    expect(findPanelButton("确定")!.className).toContain("bg-primary");
  });

  it("disabled 按钮渲染原生 disabled 属性（真实浏览器不派发 click，气泡打不开）", () => {
    // happy-dom 的 dispatchEvent 绕过 disabled 激活行为抑制，行为断言不可信——只断言渲染层属性
    const r = columnRenders<Order>();
    const w = mountCell(
      r.button([{ text: "删除", disabled: () => true, confirm: "确定删除？" }])(ORDER, 0, OPS),
    );
    expect(w.find("button[data-part='trigger']").attributes("disabled")).toBeDefined();
  });

  it("集成：经 defineTable 在 TableRender 中真实渲染 confirm 操作列", async () => {
    const onClick = vi.fn();
    const box: { def?: ReturnType<typeof defineTable<Order>> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Order>({
          data: [ORDER],
          columns: [
            {
              key: "ops",
              title: "操作",
              render: (r) => r.button([{ text: "删除", onClick, confirm: "确定删除？" }]),
            },
          ],
        });
        return () => h(TableRender, { definition: box.def, rowKey: "id" });
      },
    });
    wrapper = mount(Host, { attachTo: document.body });
    await Promise.resolve();

    // TableRender 自带列设置 Popover（closed content 同在 body）：按标题文本定位本气泡面板
    const panel = () =>
      [
        ...document.querySelectorAll<HTMLElement>('[data-scope="popover"][data-part="content"]'),
      ].find((n) => n.textContent?.includes("确定删除？"));
    const trigger = wrapper.find("tbody button[data-part='trigger']");
    expect(trigger.text()).toBe("删除");
    await trigger.trigger("click");
    await vi.waitFor(() => expect(panel()?.dataset.state).toBe("open"));
    [...panel()!.querySelectorAll("button")].find((b) => b.textContent?.includes("确定"))!.click();
    await vi.waitFor(() => expect(onClick).toHaveBeenCalledWith(ORDER, 0));
  });
});

// ---------- image（图片缩略图列） ----------

interface Photo {
  id: number;
  cover: string;
}

const PHOTO: Photo = { id: 1, cover: "https://cdn.example.com/a.png" };
const COVER_COL = { key: "cover", title: "封面" };

describe("columnRenders image", () => {
  let wrapper: ReturnType<typeof mount> | undefined;

  /** 挂载单元格渲染结果（无 portal，不需要 attachTo） */
  function mountCell(cell: unknown) {
    wrapper = mount({ setup: () => () => h("div", [cell as never]) });
    return wrapper;
  }

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
  });

  it("默认形态：src/空 alt/loading=lazy/40px/object-cover/rounded-md/bg-muted", () => {
    const r = columnRenders<Photo>();
    const w = mountCell(r.image()(PHOTO, 0, COVER_COL));
    const img = w.find("img");
    expect(img.attributes("src")).toBe(PHOTO.cover);
    expect(img.attributes("alt")).toBe("");
    expect(img.attributes("loading")).toBe("lazy");
    expect(img.attributes("style")).toContain("width: 40px");
    expect(img.attributes("style")).toContain("height: 40px");
    expect(img.classes()).toContain("object-cover");
    expect(img.classes()).toContain("rounded-md");
    expect(img.classes()).toContain("bg-muted");
  });

  it("自定义 size/fit/shape/alt 生效（字面类名）", () => {
    const r = columnRenders<Photo>();
    const w = mountCell(
      r.image({ size: 48, fit: "contain", shape: "circle", alt: "产品封面" })(PHOTO, 0, COVER_COL),
    );
    const img = w.find("img");
    expect(img.attributes("style")).toContain("width: 48px");
    expect(img.attributes("alt")).toBe("产品封面");
    expect(img.classes()).toContain("object-contain");
    expect(img.classes()).toContain("rounded-full");
  });

  it("空值守卫：null/undefined/空串/非字符串 → 空字符串不产生节点", () => {
    const r = columnRenders<Photo>();
    for (const raw of [null, undefined, "", 123, { url: "x" }]) {
      const cell = r.image()({ id: 1, cover: raw } as unknown as Photo, 0, COVER_COL);
      expect(cell).toBe("");
    }
  });

  it("加载失败 + fallback：切换备用图 URL（仅一次）", async () => {
    const r = columnRenders<Photo>();
    const w = mountCell(
      r.image({ fallback: "https://cdn.example.com/b.png" })(PHOTO, 0, COVER_COL),
    );
    w.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(w.find("img").attributes("src")).toBe("https://cdn.example.com/b.png");
  });

  it("加载失败无 fallback → 占位盒；备用图也失败 → 占位盒", async () => {
    const r = columnRenders<Photo>();
    const w1 = mountCell(r.image()(PHOTO, 0, COVER_COL));
    w1.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(w1.find("img").exists()).toBe(false);
    expect(w1.find("div[aria-hidden='true'] svg").exists()).toBe(true);
    w1.unmount();

    const w2 = mountCell(
      r.image({ fallback: "https://cdn.example.com/b.png" })(PHOTO, 0, COVER_COL),
    );
    w2.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(w2.find("img").attributes("src")).toBe("https://cdn.example.com/b.png");
    w2.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(w2.find("img").exists()).toBe(false);
    expect(w2.find("div[aria-hidden='true'] svg").exists()).toBe(true);
  });

  it("src 变更复位 error 状态（虚拟滚动/分页行复用回归锁）", async () => {
    const src = ref(PHOTO.cover);
    const r = columnRenders<Photo>();
    wrapper = mount(
      defineComponent({
        setup: () => () => h("div", [r.image()({ id: 1, cover: src.value }, 0, COVER_COL)]),
      }),
    );
    wrapper.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(wrapper.find("img").exists()).toBe(false);

    src.value = "https://cdn.example.com/new.png";
    await nextTick();
    expect(wrapper.find("img").attributes("src")).toBe("https://cdn.example.com/new.png");
  });

  it("函数 alt/fallback 按行求值", async () => {
    const r = columnRenders<Photo>();
    const w = mountCell(
      r.image({
        alt: (rec, i) => `封面-${rec.id}-${i}`,
        fallback: (rec) => `https://cdn.example.com/fallback-${rec.id}.png`,
      })(PHOTO, 3, COVER_COL),
    );
    expect(w.find("img").attributes("alt")).toBe("封面-1-3");
    w.find("img").element.dispatchEvent(new Event("error"));
    await nextTick();
    expect(w.find("img").attributes("src")).toBe("https://cdn.example.com/fallback-1.png");
  });

  it("集成：经 defineTable 在 TableRender 中真实渲染图片列", async () => {
    const Host = defineComponent({
      setup() {
        const def = defineTable<Photo>({
          data: [PHOTO],
          columns: [
            { key: "id", title: "ID" },
            { key: "cover", title: "封面", render: (r) => r.image({ alt: "封面图" }) },
          ],
        });
        return () => h(TableRender, { definition: def, rowKey: "id" });
      },
    });
    wrapper = mount(Host, { attachTo: document.body });
    await Promise.resolve();
    const img = wrapper.find("tbody img");
    expect(img.attributes("src")).toBe(PHOTO.cover);
    expect(img.attributes("alt")).toBe("封面图");
    expect(img.attributes("loading")).toBe("lazy");
  });
});
