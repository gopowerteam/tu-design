import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { describe, expect, it, vi } from "vite-plus/test";
import Textarea from "./Textarea.vue";

function mountTextarea(props: Record<string, unknown> = {}) {
  const Host = defineComponent({
    setup() {
      return () => h(Textarea, props);
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Textarea", () => {
  it("v-model 双向绑定", async () => {
    const onUpdate = vi.fn();
    const w = mountTextarea({ "onUpdate:modelValue": onUpdate });
    const el = w.find("textarea");

    await el.setValue("第一行");
    expect(onUpdate).toHaveBeenCalledWith("第一行");
    expect((el.element as HTMLTextAreaElement).value).toBe("第一行");
    w.unmount();
  });

  it("invalid 时输出 aria-invalid 并带 destructive 校验样式", () => {
    const w = mountTextarea({ invalid: true });
    const el = w.find("textarea");
    expect(el.attributes("aria-invalid")).toBe("true");
    expect(el.classes()).toContain("aria-invalid:border-destructive");
    w.unmount();
  });

  it("不传 invalid 时无 aria-invalid 属性", () => {
    const w = mountTextarea();
    expect(w.find("textarea").attributes("aria-invalid")).toBeUndefined();
    w.unmount();
  });

  it("原生属性透传（placeholder/rows/disabled）", () => {
    const w = mountTextarea({ placeholder: "请输入", rows: 4, disabled: true });
    const el = w.find("textarea");
    expect(el.attributes("placeholder")).toBe("请输入");
    expect(el.attributes("rows")).toBe("4");
    expect((el.element as HTMLTextAreaElement).disabled).toBe(true);
    w.unmount();
  });

  it("受控 v-model:modelValue 外部值生效", async () => {
    const value = ref("");
    const Host = defineComponent({
      setup() {
        return () =>
          h(Textarea, {
            modelValue: value.value,
            "onUpdate:modelValue": (v: string) => (value.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find("textarea").setValue("受控值");
    expect(value.value).toBe("受控值");
    w.unmount();
  });
});
