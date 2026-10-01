import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Switch } from "./index";

const control = () =>
  document.querySelector<HTMLElement>('[data-scope="switch"][data-part="control"]');
const thumb = () => document.querySelector<HTMLElement>('[data-scope="switch"][data-part="thumb"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="switch"]').forEach((n) => n.remove());
});

function mountSwitch(props: Record<string, unknown> = {}, slot?: string) {
  const Host = defineComponent({
    setup() {
      return () => h(Switch, props, { default: () => slot });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Switch", () => {
  it("默认关，点击切换并发出 update:checked", async () => {
    const onUpdate = vi.fn();
    const w = mountSwitch({ "onUpdate:checked": onUpdate });
    expect(control()!.dataset.state).toBe("unchecked");

    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(control()!.dataset.state).toBe("checked"));
    expect(onUpdate).toHaveBeenCalledWith(true);
    expect(thumb()).not.toBeNull();
    w.unmount();
  });

  it("标签插槽点击同样切换", async () => {
    const w = mountSwitch({}, "飞行模式");
    expect(w.text()).toContain("飞行模式");

    await w.find('[data-part="label"]').trigger("click");
    await vi.waitFor(() => expect(control()!.dataset.state).toBe("checked"));
    w.unmount();
  });

  it("v-model:checked 受控", async () => {
    const checked = ref(true);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Switch, {
            checked: checked.value,
            "onUpdate:checked": (v: boolean) => (checked.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });
    expect(control()!.dataset.state).toBe("checked");

    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(checked.value).toBe(false));
    w.unmount();
  });
});
