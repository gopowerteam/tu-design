import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Checkbox } from "./index";

const control = () =>
  document.querySelector<HTMLElement>('[data-scope="checkbox"][data-part="control"]');

afterEach(() => {
  document.body.querySelectorAll('[data-scope="checkbox"]').forEach((n) => n.remove());
});

function mountCheckbox(props: Record<string, unknown> = {}, slot?: string) {
  const Host = defineComponent({
    setup() {
      return () => h(Checkbox, props, { default: () => slot });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Checkbox", () => {
  it("默认未选中，点击切换并发出 update:checked", async () => {
    const onUpdate = vi.fn();
    const w = mountCheckbox({ "onUpdate:checked": onUpdate });
    expect(control()!.dataset.state).toBe("unchecked");

    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(control()!.dataset.state).toBe("checked"));
    expect(onUpdate).toHaveBeenCalledWith(true);

    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(control()!.dataset.state).toBe("unchecked"));
    expect(onUpdate).toHaveBeenLastCalledWith(false);
    w.unmount();
  });

  it("defaultChecked 初始选中", async () => {
    const w = mountCheckbox({ defaultChecked: true });
    expect(control()!.dataset.state).toBe("checked");
    w.unmount();
  });

  it("标签插槽点击同样切换", async () => {
    const onUpdate = vi.fn();
    const w = mountCheckbox({ "onUpdate:checked": onUpdate }, "同意条款");
    expect(w.text()).toContain("同意条款");

    await w.find('[data-part="label"]').trigger("click");
    await vi.waitFor(() => expect(control()!.dataset.state).toBe("checked"));
    expect(onUpdate).toHaveBeenCalledWith(true);
    w.unmount();
  });

  it("disabled 不响应点击", async () => {
    const onUpdate = vi.fn();
    const w = mountCheckbox({ disabled: true, "onUpdate:checked": onUpdate });

    await w.find('[data-part="control"]').trigger("click");
    await new Promise((r) => setTimeout(r, 40));
    expect(control()!.dataset.state).toBe("unchecked");
    expect(onUpdate).not.toHaveBeenCalled();
    w.unmount();
  });

  it("v-model:checked 受控", async () => {
    const checked = ref(false);
    const Host = defineComponent({
      setup() {
        return () =>
          h(Checkbox, {
            checked: checked.value,
            "onUpdate:checked": (v: boolean) => (checked.value = v),
          });
      },
    });
    const w = mount(Host, { attachTo: document.body });

    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(checked.value).toBe(true));
    w.unmount();
  });
});

describe("Checkbox 半选态（S10，TableRender 全选依赖）", () => {
  it('checked="indeterminate" 渲染半选状态', () => {
    const w = mountCheckbox({ checked: "indeterminate" });
    expect(control()!.dataset.state).toBe("indeterminate");
    w.unmount();
  });

  it("受控 true/false 正常切换，半选由父级收回", () => {
    const w = mountCheckbox({ checked: true });
    expect(control()!.dataset.state).toBe("checked");
    w.unmount();
  });

  it("点击半选框发出 boolean（非 indeterminate）", async () => {
    const onUpdate = vi.fn();
    const w = mountCheckbox({ checked: "indeterminate", "onUpdate:checked": onUpdate });
    await w.find('[data-part="control"]').trigger("click");
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(typeof onUpdate.mock.calls[0][0]).toBe("boolean");
    w.unmount();
  });

  it("name/form 透传到原生 input（原生表单提交可用）", () => {
    mountCheckbox({ name: "agree", form: "profile-form" });
    const input = document.querySelector<HTMLInputElement>(
      '[data-scope="checkbox"] input[type="checkbox"]',
    );
    expect(input?.getAttribute("name")).toBe("agree");
    expect(input?.getAttribute("form")).toBe("profile-form");
  });
});
