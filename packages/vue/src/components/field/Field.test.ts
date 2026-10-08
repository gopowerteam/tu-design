import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  Field,
  FieldErrorText,
  FieldHelperText,
  FieldInput,
  FieldLabel,
  FieldTextarea,
} from "./index";

afterEach(() => {
  document.body.querySelectorAll('[data-scope="field"]').forEach((n) => n.remove());
});

function mountField(fieldProps: Record<string, unknown> = {}, children: () => unknown) {
  const Host = defineComponent({
    setup() {
      return () => h(Field, fieldProps, { default: children });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Field", () => {
  it("invalid 时 input 带 aria-invalid，且 aria-errormessage 指向已渲染的 ErrorText", async () => {
    const w = mountField({ invalid: true }, () => [
      h(FieldLabel, null, () => "用户名"),
      h(FieldInput),
      h(FieldErrorText, null, () => "用户名不能为空"),
    ]);
    const input = w.find("input");

    await vi.waitFor(() => expect(input.attributes("aria-errormessage")).toBeTruthy());
    expect(input.attributes("aria-invalid")).toBe("true");
    const errId = input.attributes("aria-errormessage")!;
    expect(document.getElementById(errId)!.textContent).toContain("用户名不能为空");
    w.unmount();
  });

  it("不传 invalid 时无 aria-invalid/aria-errormessage", () => {
    const w = mountField({}, () => [h(FieldInput)]);
    const input = w.find("input");
    expect(input.attributes("aria-invalid")).toBeUndefined();
    expect(input.attributes("aria-errormessage")).toBeUndefined();
    w.unmount();
  });

  it("HelperText 经 aria-describedby 关联", async () => {
    const w = mountField({}, () => [
      h(FieldInput),
      h(FieldHelperText, null, () => "不超过 20 个字符"),
    ]);
    const input = w.find("input");

    await vi.waitFor(() => expect(input.attributes("aria-describedby")).toBeTruthy());
    const id = input.attributes("aria-describedby")!;
    expect(document.getElementById(id)!.textContent).toContain("不超过 20 个字符");
    w.unmount();
  });

  it("FieldLabel 的 for 指向 input 的 id", () => {
    const w = mountField({}, () => [h(FieldLabel, null, () => "邮箱"), h(FieldInput)]);
    const input = w.find("input");
    expect(input.attributes("id")).toBeTruthy();
    expect(w.find("label").attributes("for")).toBe(input.attributes("id"));
    w.unmount();
  });

  it("disabled 透传为原生属性", () => {
    const w = mountField({ disabled: true }, () => [h(FieldInput)]);
    expect((w.find("input").element as HTMLInputElement).disabled).toBe(true);
    w.unmount();
  });

  it("FieldInput/FieldTextarea 样式与 Input/Textarea 对齐（防漂移钉子）", () => {
    const w = mountField({}, () => [h(FieldInput), h(FieldTextarea)]);
    expect(w.find("input").classes()).toContain("focus-visible:ring-[3px]");
    expect(w.find("input").classes()).toContain("aria-invalid:border-destructive");
    expect(w.find("textarea").classes()).toContain("min-h-16");
    expect(w.find("textarea").classes()).toContain("aria-invalid:border-destructive");
    w.unmount();
  });
});
