import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { describe, expect, it } from "vite-plus/test";
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
    const r = columnRenders<Order>();
    const box: { def?: ReturnType<typeof defineTable<Order>> } = {};
    const Host = defineComponent({
      setup() {
        box.def = defineTable<Order>({
          data: [ORDER],
          columns: [
            { key: "status", title: "状态", render: r.dict({ paid: "已付款" }) },
            { key: "createdAt", title: "日期", render: r.date("yyyy/MM/dd") },
            { key: "amount", title: "金额", render: r.currency("CNY") },
            { key: "x", title: "#", render: r.serial() },
            { key: "ops", title: "操作", render: r.button([{ text: "编辑" }, "删除"]) },
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
