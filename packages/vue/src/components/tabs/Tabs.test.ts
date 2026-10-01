import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./index";

const contents = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="content"]'),
];
const contentBy = (text: string) => contents().find((c) => c.textContent?.includes(text));
const triggers = () => [
  ...document.querySelectorAll<HTMLElement>('[data-scope="tabs"][data-part="trigger"]'),
];

afterEach(() => {
  document.body.querySelectorAll('[data-scope="tabs"]').forEach((n) => n.remove());
});

interface HostOptions {
  props?: Record<string, unknown>;
  disabledSecond?: boolean;
}

function mountTabs(options: HostOptions = {}) {
  const { props = {}, disabledSecond = false } = options;
  const Host = defineComponent({
    setup() {
      return () =>
        h(Tabs, props, {
          default: () => [
            h(TabsList, null, () => [
              h(TabsTrigger, { value: "account" }, () => "账户"),
              h(TabsTrigger, { value: "password", disabled: disabledSecond }, () => "密码"),
            ]),
            h(TabsContent, { value: "account" }, () => "账户内容"),
            h(TabsContent, { value: "password" }, () => "密码内容"),
          ],
        });
    },
  });
  return mount(Host, { attachTo: document.body });
}

describe("Tabs", () => {
  it("默认展示 defaultValue 对应面板，点击切换并发出 update:value", async () => {
    const onUpdate = vi.fn();
    const w = mountTabs({ props: { defaultValue: "account", "onUpdate:value": onUpdate } });

    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(true);

    triggers()[1]!.click();
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith("password"));
    await vi.waitFor(() => {
      expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false);
      expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(true);
    });
    w.unmount();
  });

  it("v-model:value 受控", async () => {
    const value = ref("account");
    const Host = defineComponent({
      setup() {
        return () =>
          h(
            Tabs,
            { value: value.value, "onUpdate:value": (v: string) => (value.value = v) },
            {
              default: () => [
                h(TabsList, null, () => [
                  h(TabsTrigger, { value: "account" }, () => "账户"),
                  h(TabsTrigger, { value: "password" }, () => "密码"),
                ]),
                h(TabsContent, { value: "account" }, () => "账户内容"),
                h(TabsContent, { value: "password" }, () => "密码内容"),
              ],
            },
          );
      },
    });
    const w = mount(Host, { attachTo: document.body });

    triggers()[1]!.click();
    await vi.waitFor(() => expect(value.value).toBe("password"));
    await vi.waitFor(() => expect(contentBy("密码内容")!.hasAttribute("hidden")).toBe(false));
    w.unmount();
  });

  it("Trigger 应用变体类与 data-selected 状态", async () => {
    const w = mountTabs({ props: { defaultValue: "account" } });
    const [first, second] = triggers();
    // zag 的 data-selected 为空串存在属性
    expect(first!.hasAttribute("data-selected")).toBe(true);
    expect(second!.hasAttribute("data-selected")).toBe(false);
    expect(first!.className).toContain("data-[selected]:bg-background");
    w.unmount();
  });

  it("disabled Trigger 不可切换", async () => {
    const onUpdate = vi.fn();
    const w = mountTabs({
      props: { defaultValue: "account", "onUpdate:value": onUpdate },
      disabledSecond: true,
    });

    triggers()[1]!.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(contentBy("账户内容")!.hasAttribute("hidden")).toBe(false);
    w.unmount();
  });
});
