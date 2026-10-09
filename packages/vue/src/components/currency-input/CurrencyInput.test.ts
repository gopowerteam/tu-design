import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { CurrencyInput, formatCurrency, parseCurrency } from "./index";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("parseCurrency（字符串移位换算，整数分精度）", () => {
  it("万→元：1.5 → 15000", () => {
    expect(parseCurrency("1.5", "万", "元")).toBe(15000);
  });

  it("元→分：0.29 → 29（规避浮点误差，不是 28.99…）", () => {
    expect(parseCurrency("0.29", "元", "分")).toBe(29);
  });

  it("元→分：1.234 → 123（四舍五入到整数分）", () => {
    expect(parseCurrency("1.234", "元", "分")).toBe(123);
    expect(parseCurrency("1.235", "元", "分")).toBe(124);
  });

  it("同单位：2.5 元→元 → 2.5", () => {
    expect(parseCurrency("2.5", "元", "元")).toBe(2.5);
  });

  it("角→分：12.5 → 125", () => {
    expect(parseCurrency("12.5", "角", "分")).toBe(125);
  });

  it("分→元：10 → 0.1", () => {
    expect(parseCurrency("10", "分", "元")).toBe(0.1);
  });

  it("万→分：1 → 1000000", () => {
    expect(parseCurrency("1", "万", "分")).toBe(1000000);
  });

  it(".5 省略整数位：元→分 → 50", () => {
    expect(parseCurrency(".5", "元", "分")).toBe(50);
  });

  it("空串/小数点/负号/非法字符 → null", () => {
    expect(parseCurrency("", "元", "元")).toBeNull();
    expect(parseCurrency(".", "元", "元")).toBeNull();
    expect(parseCurrency("-", "元", "元")).toBeNull();
    expect(parseCurrency("-5", "元", "元")).toBeNull();
    expect(parseCurrency("abc", "元", "元")).toBeNull();
    expect(parseCurrency("1.2.3", "元", "元")).toBeNull();
    expect(parseCurrency("1e5", "元", "元")).toBeNull();
  });
});

describe("formatCurrency（外部值 → labelUnit 回显文本）", () => {
  it("15000 元 以万回显 → '1.5'", () => {
    expect(formatCurrency(15000, "元", "万")).toBe("1.5");
  });

  it("12345 分 以元回显 → '123.45'", () => {
    expect(formatCurrency(12345, "分", "元")).toBe("123.45");
  });

  it("0.1 元 以分回显 → '10'（浮点噪声被取整吸收）", () => {
    expect(formatCurrency(0.1, "元", "分")).toBe("10");
  });

  it("同单位原样回显并去尾零", () => {
    expect(formatCurrency(2.5, "元", "元")).toBe("2.5");
    expect(formatCurrency(15000, "元", "万")).toBe("1.5");
  });

  it("负值回显保留负号（解析层已禁负，仅外部直赋可能出现）", () => {
    expect(formatCurrency(-5, "元", "元")).toBe("-5");
  });
});

describe("CurrencyInput 组件", () => {
  it("渲染 input[type=text][inputmode=decimal] 与单位后缀（默认元，aria-hidden）", () => {
    const w = mount(CurrencyInput, { attachTo: document.body });
    const input = w.find("input");
    expect(input.attributes("type")).toBe("text");
    expect(input.attributes("inputmode")).toBe("decimal");
    const suffix = w.find("[aria-hidden='true']");
    expect(suffix.exists()).toBe(true);
    expect(suffix.text()).toBe("元");
    w.unmount();
  });

  it("labelUnit=万 时后缀显示「万」", () => {
    const w = mount(CurrencyInput, { props: { labelUnit: "万" }, attachTo: document.body });
    expect(w.find("[aria-hidden='true']").text()).toBe("万");
    w.unmount();
  });

  it("输入 1.5（万→元）发出 update:modelValue 15000", async () => {
    const onUpdate = vi.fn();
    const w = mount(CurrencyInput, {
      props: { labelUnit: "万", valueUnit: "元", "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find("input").setValue("1.5");
    expect(onUpdate).toHaveBeenLastCalledWith(15000);
    w.unmount();
  });

  it("清空输入发出 null", async () => {
    const onUpdate = vi.fn();
    const w = mount(CurrencyInput, {
      props: { modelValue: 100, "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find("input").setValue("");
    expect(onUpdate).toHaveBeenLastCalledWith(null);
    w.unmount();
  });

  it("输入 -5（禁负）发出 null，输入框保留键入文本", async () => {
    const onUpdate = vi.fn();
    const w = mount(CurrencyInput, {
      props: { "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find("input").setValue("-5");
    expect(onUpdate).toHaveBeenLastCalledWith(null);
    expect((w.find("input").element as HTMLInputElement).value).toBe("-5");
    w.unmount();
  });

  it("外部 modelValue=15000（valueUnit 元，labelUnit 万）回显 1.5", async () => {
    const w = mount(CurrencyInput, {
      props: { labelUnit: "万", valueUnit: "元", modelValue: 15000 },
      attachTo: document.body,
    });
    expect((w.find("input").element as HTMLInputElement).value).toBe("1.5");
    await w.setProps({ modelValue: 30000 });
    expect((w.find("input").element as HTMLInputElement).value).toBe("3");
    w.unmount();
  });

  it("受控 modelValue=null 回显空串", () => {
    const w = mount(CurrencyInput, { props: { modelValue: null }, attachTo: document.body });
    expect((w.find("input").element as HTMLInputElement).value).toBe("");
    w.unmount();
  });

  it("非受控模式：输入发出值并保留键入文本", async () => {
    const onUpdate = vi.fn();
    const w = mount(CurrencyInput, {
      props: { "onUpdate:modelValue": onUpdate },
      attachTo: document.body,
    });
    await w.find("input").setValue("2.5");
    expect(onUpdate).toHaveBeenLastCalledWith(2.5);
    expect((w.find("input").element as HTMLInputElement).value).toBe("2.5");
    w.unmount();
  });

  it("受控回写自身刚发出的值不重写输入框（'1.50' 不被打断）", async () => {
    const w = mount(CurrencyInput, {
      props: { modelValue: null },
      attachTo: document.body,
    });
    await w.find("input").setValue("1.50");
    await w.setProps({ modelValue: 1.5 });
    expect((w.find("input").element as HTMLInputElement).value).toBe("1.50");
    w.unmount();
  });

  it("attrs 透传到真实 input（id/aria-label）", () => {
    const w = mount(CurrencyInput, {
      attrs: { id: "amount", "aria-label": "合同金额" },
      attachTo: document.body,
    });
    const input = w.find("input");
    expect(input.attributes("id")).toBe("amount");
    expect(input.attributes("aria-label")).toBe("合同金额");
    w.unmount();
  });

  it("invalid 时容器带 data-invalid、input 带 aria-invalid", () => {
    const w = mount(CurrencyInput, { props: { invalid: true }, attachTo: document.body });
    expect(w.find("[data-invalid]").exists()).toBe(true);
    expect(w.find("input").attributes("aria-invalid")).toBe("true");
    w.unmount();
  });

  it("disabled 时 input 禁用", () => {
    const w = mount(CurrencyInput, { props: { disabled: true }, attachTo: document.body });
    expect(w.find("input").attributes("disabled")).toBeDefined();
    w.unmount();
  });

  it("placeholder 透传", () => {
    const w = mount(CurrencyInput, { props: { placeholder: "0.00" }, attachTo: document.body });
    expect(w.find("input").attributes("placeholder")).toBe("0.00");
    w.unmount();
  });
});
