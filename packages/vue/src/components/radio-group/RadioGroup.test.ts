import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { RadioGroup, RadioGroupItem } from "./index";

const items = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item"]'),
];
const itemControls = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="radio-group"][data-part="item-control"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="radio-group"]').forEach((n) => n.remove());
});

function mountGroup(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () =>
        h(RadioGroup, props, {
          default: () => [
            h(RadioGroupItem, { value: "weekly" }, () => "每周"),
            h(RadioGroupItem, { value: "monthly" }, () => "每月"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("RadioGroup", () => {
  it("点击选中并发出 update:value，单选互斥", async () => {
    const onUpdate = vi.fn();
    const w = mountGroup({ "onUpdate:value": onUpdate });

    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    items()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("monthly"));
    await vi.waitFor(() => expect(itemControls()[1]!.dataset.state).toBe("checked"));
    expect(itemControls()[0]!.dataset.state).toBe("unchecked");
    w.unmount();
  });

  it("defaultvalue 初始选中", async () => {
    const w = mountGroup({ defaultValue: "weekly" });
    await vi.waitFor(() => expect(itemControls()[0]!.dataset.state).toBe("checked"));
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("weekly");
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            RadioGroup,
            { value: value.value, "onUpdate:value": (v: string) => (value.value = v) },
            {
              default: () => [
                h(RadioGroupItem, { value: "weekly" }, () => "每周"),
                h(RadioGroupItem, { value: "monthly" }, () => "每月"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    items()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("monthly"));
    w.unmount();
  });

  it("RadioGroupItem 渲染圆形控件与文本", async () => {
    const w = mountGroup();
    expect(itemControls()[0]!.className).toContain("rounded-full");
    expect(items()[0]!.textContent).toContain("每周");
    w.unmount();
  });
});
