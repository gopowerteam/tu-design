import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Progress } from "./index";

const root = () => document.querySelector<HTMLElement>('[data-scope="progress"][data-part="root"]');
const track = () =>
  document.querySelector<HTMLElement>('[data-scope="progress"][data-part="track"]');
const range = () =>
  document.querySelector<HTMLElement>('[data-scope="progress"][data-part="range"]');
const label = () =>
  document.querySelector<HTMLElement>('[data-scope="progress"][data-part="label"]');
const valueText = () =>
  document.querySelector<HTMLElement>('[data-scope="progress"][data-part="value-text"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="progress"]').forEach((n) => n.remove());
});

function mountProgress(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Progress, props);
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Progress", () => {
  it("非受控默认 value 为 0，ark progressbar 语义保留（aria 挂在 track 上）", () => {
    const w = mountProgress();
    const el = track();
    expect(el).not.toBeNull();
    expect(el!.getAttribute("role")).toBe("progressbar");
    expect(el!.getAttribute("aria-valuemin")).toBe("0");
    expect(el!.getAttribute("aria-valuemax")).toBe("100");
    expect(el!.getAttribute("aria-valuenow")).toBe("0");
    expect(root()!.getAttribute("data-value")).toBe("0");
    w.unmount();
  });

  it("v-model:value 受控：外部值驱动 aria-valuenow 与 range 宽度", async () => {
    const value = ref<number | null>(40);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Progress, {
            value: value.value,
            "onUpdate:value": (v: number | null) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    expect(track()!.getAttribute("aria-valuenow")).toBe("40");
    await vi.waitFor(() => expect(range()!.style.width).toBe("40%"));

    value.value = 70;
    await vi.waitFor(() => expect(track()!.getAttribute("aria-valuenow")).toBe("70"));
    await vi.waitFor(() => expect(range()!.style.width).toBe("70%"));
    w.unmount();
  });

  it("max 调整量程与百分比", async () => {
    const w = mountProgress({ value: 25, max: 50 });
    expect(track()!.getAttribute("aria-valuemax")).toBe("50");
    await vi.waitFor(() => expect(range()!.style.width).toBe("50%"));
    w.unmount();
  });

  it("label 渲染标签，showValue 控制百分比文本", async () => {
    const w = mountProgress({ value: 40, label: "上传中", showValue: true });
    expect(label()!.textContent).toBe("上传中");
    await vi.waitFor(() => expect(valueText()!.textContent).toBe("40%"));
    w.unmount();

    const w2 = mountProgress({ value: 40 });
    expect(valueText()).toBeNull();
    w2.unmount();
  });

  it("type 映射语义着色 class（default 用 primary）", () => {
    const cases = [
      { type: undefined, expected: "bg-primary" },
      { type: "info", expected: "bg-info" },
      { type: "success", expected: "bg-success" },
      { type: "warning", expected: "bg-warning" },
      { type: "error", expected: "bg-destructive" },
    ] as const;
    for (const { type, expected } of cases) {
      const w = mountProgress({ value: 40, type });
      expect(range()!.className).toContain(expected);
      w.unmount();
    }
  });

  it("indeterminate 与受控 value=null 均为不确定态", async () => {
    const w = mountProgress({ indeterminate: true });
    await vi.waitFor(() => expect(root()!.getAttribute("data-state")).toBe("indeterminate"));
    expect(track()!.getAttribute("aria-valuenow")).toBeNull();
    w.unmount();

    const w2 = mountProgress({ value: null });
    await vi.waitFor(() => expect(root()!.getAttribute("data-state")).toBe("indeterminate"));
    expect(track()!.getAttribute("aria-valuenow")).toBeNull();
    w2.unmount();
  });

  it("class 透传到根元素", () => {
    const w = mountProgress({ value: 40, class: "w-64" });
    expect(root()!.className).toContain("w-64");
    w.unmount();
  });
});
