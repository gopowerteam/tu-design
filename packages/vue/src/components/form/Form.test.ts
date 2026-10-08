import { mount } from "@vue/test-utils";
import { useForm } from "@tanstack/vue-form";
import { describe, expect, it, vi } from "vite-plus/test";
import { Form } from "./index";

describe("Form", () => {
  it("渲染 form 元素且 class 合并", () => {
    const form = useForm({ defaultValues: { email: "" } });
    const w = mount(Form, { props: { form, class: "space-y-6" }, attachTo: document.body });
    expect(w.element.tagName).toBe("FORM");
    expect(w.classes()).toContain("space-y-6");
    w.unmount();
  });

  it("submit 阻止默认行为并调用 form.handleSubmit", async () => {
    const form = useForm({ defaultValues: { email: "" }, onSubmit: async () => {} });
    const spy = vi.spyOn(form, "handleSubmit");
    const w = mount(Form, { props: { form }, attachTo: document.body });

    const event = new Event("submit", { cancelable: true });
    w.element.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    w.unmount();
  });
});
