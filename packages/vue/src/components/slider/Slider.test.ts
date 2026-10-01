import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Slider } from "./index";

const thumbs = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="slider"][data-part="thumb"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="slider"]').forEach((n) => n.remove());
});

function mountSlider(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Slider, props);
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Slider", () => {
  it("单值渲染单个拇指，键盘 ArrowRight 按 step 递增", async () => {
    const onUpdate = vi.fn();
    const w = mountSlider({ defaultValue: 50, "onUpdate:modelValue": onUpdate });
    expect(thumbs().length).toBe(1);

    thumbs()[0]!.focus();
    thumbs()[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith([51]));
    w.unmount();
  });

  it("v-model 受控（数组语义）", async () => {
    const value = ref<number[]>([20]);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Slider, {
            value: value.value,
            "onUpdate:modelValue": (v: number[]) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    thumbs()[0]!.focus();
    thumbs()[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    await vi.waitFor(() => expect(value.value).toEqual([19]));
    w.unmount();
  });

  it("区间渲染两个拇指", async () => {
    const w = mountSlider({ defaultValue: [20, 80] });
    expect(thumbs().length).toBe(2);
    w.unmount();
  });

  it("min/max/step 影响递增量", async () => {
    const onUpdate = vi.fn();
    const w = mountSlider({
      defaultValue: 10,
      min: 0,
      max: 50,
      step: 5,
      "onUpdate:modelValue": onUpdate,
    });

    thumbs()[0]!.focus();
    thumbs()[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith([15]));
    w.unmount();
  });
});
