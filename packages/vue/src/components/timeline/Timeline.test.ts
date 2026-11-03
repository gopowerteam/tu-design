import { mount } from "@vue/test-utils";
import { h } from "vue";
import { describe, expect, it } from "vite-plus/test";
import { Timeline, type TimelineItemData } from "./index";

const items: TimelineItemData[] = [
  { timestamp: "2026-01-01", title: "v1.0.0", content: "首次发布" },
  { timestamp: "2026-02-01", title: "v1.1.0", content: "新增 Timeline 组件" },
  { timestamp: "2026-03-01", title: "v1.2.0", content: "修复若干问题" },
];

describe("Timeline", () => {
  it("按 items 渲染 ol/li，各分区 data-slot 齐全", () => {
    const w = mount(Timeline, { props: { items } });
    const ol = w.find('[data-slot="timeline"]');
    expect(ol.exists()).toBe(true);
    expect(ol.element.tagName).toBe("OL");
    expect(ol.classes()).toContain("list-none");

    const lis = w.findAll('[data-slot="timeline-item"]');
    expect(lis).toHaveLength(items.length);
    for (const li of lis) {
      expect(li.find('[data-slot="timeline-line"]').exists()).toBe(true);
      expect(li.find('[data-slot="timeline-dot"]').exists()).toBe(true);
      expect(li.find('[data-slot="timeline-content"]').exists()).toBe(true);
    }

    const first = lis[0]!;
    expect(first.find('[data-slot="timeline-timestamp"]').text()).toBe("2026-01-01");
    expect(first.find('[data-slot="timeline-title"]').text()).toBe("v1.0.0");
    expect(first.find('[data-slot="timeline-description"]').text()).toBe("首次发布");
  });

  it("mode=alternate：容器 isolate，奇偶内容列位置与对齐交替，节点居中轴", () => {
    const w = mount(Timeline, { props: { items, mode: "alternate" } });
    expect(w.classes()).toContain("isolate");

    const contents = w.findAll('[data-slot="timeline-content"]');
    expect(contents[0]!.classes()).toEqual(
      expect.arrayContaining(["col-start-1", "row-start-1", "pr-4", "text-right"]),
    );
    expect(contents[1]!.classes()).toEqual(
      expect.arrayContaining(["col-start-3", "row-start-1", "pl-4", "text-left"]),
    );
    expect(contents[2]!.classes()).toContain("col-start-1");

    const dot = w.find('[data-slot="timeline-dot"]');
    expect(dot.classes()).toEqual(expect.arrayContaining(["col-start-2", "row-start-1"]));
  });

  it("dotColor 五色实心与 hollow 空心（描边 + 背景填充）", () => {
    const colors = [
      ["primary", "bg-primary"],
      ["success", "bg-success"],
      ["warning", "bg-warning"],
      ["destructive", "bg-destructive"],
      ["muted", "bg-muted-foreground"],
    ] as const;
    for (const [color, cls] of colors) {
      const w = mount(Timeline, { props: { items: [{ title: "x", dotColor: color }] } });
      expect(w.find('[data-slot="timeline-dot"]').classes()).toContain(cls);
    }

    const hollow = mount(Timeline, {
      props: { items: [{ title: "x", dotColor: "warning", hollow: true }] },
    });
    const dot = hollow.find('[data-slot="timeline-dot"]');
    expect(dot.classes()).toEqual(
      expect.arrayContaining(["border-2", "bg-background", "border-warning"]),
    );
    expect(dot.classes()).not.toContain("bg-warning");
  });

  it("timestampPlacement=bottom 通过 order-last 下移时间戳", () => {
    const top = mount(Timeline, { props: { items: [{ timestamp: "t", title: "x" }] } });
    const topTs = top.find('[data-slot="timeline-timestamp"]');
    expect(topTs.classes()).toContain("mb-1");
    expect(topTs.classes()).not.toContain("order-last");

    const bottom = mount(Timeline, {
      props: { items: [{ timestamp: "t", title: "x", timestampPlacement: "bottom" }] },
    });
    const ts = bottom.find('[data-slot="timeline-timestamp"]');
    expect(ts.classes()).toEqual(expect.arrayContaining(["order-last", "mt-1.5"]));
  });

  it("#item 作用域插槽接收 {item, index} 并整项覆盖默认渲染", () => {
    const w = mount(Timeline, {
      props: { items },
      slots: {
        item: ({ item, index }: { item: TimelineItemData; index: number }) =>
          h("em", `#${index}:${item.title}`),
      },
    });
    expect(w.find('[data-slot="timeline-timestamp"]').exists()).toBe(false);
    expect(w.find('[data-slot="timeline-title"]').exists()).toBe(false);
    expect(w.find('[data-slot="timeline-description"]').exists()).toBe(false);
    const ems = w.findAll("em");
    expect(ems[0]!.text()).toBe("#0:v1.0.0");
    expect(ems[1]!.text()).toBe("#1:v1.1.0");
    // dot 与 line 不受插槽影响
    expect(w.find('[data-slot="timeline-dot"]').exists()).toBe(true);
    expect(w.find('[data-slot="timeline-line"]').exists()).toBe(true);
  });

  it("用户 class 与容器默认类经 cn 合并", () => {
    const w = mount(Timeline, { props: { items, class: "my-6 max-w-md" } });
    expect(w.classes()).toEqual(expect.arrayContaining(["m-0", "list-none", "my-6", "max-w-md"]));
  });

  it("空 items 渲染空 ol（无 li）", () => {
    const w = mount(Timeline, { props: { items: [] } });
    expect(w.find('[data-slot="timeline"]').exists()).toBe(true);
    expect(w.findAll('[data-slot="timeline-item"]')).toHaveLength(0);
  });

  it("首末项 line 按 index 裁切，中段完整贯穿", () => {
    const w = mount(Timeline, { props: { items } });
    const lines = w.findAll('[data-slot="timeline-line"]');

    const first = lines[0]!.classes();
    expect(first).toContain("top-[10px]");
    expect(first).not.toContain("top-0");
    expect(first).toContain("bottom-0");

    const middle = lines[1]!.classes();
    expect(middle).toEqual(expect.arrayContaining(["top-0", "bottom-0"]));

    const last = lines[2]!.classes();
    expect(last).toContain("top-0");
    expect(last).toContain("bottom-[calc(100%-10px)]");
    expect(last).not.toContain("bottom-0");
  });
});
