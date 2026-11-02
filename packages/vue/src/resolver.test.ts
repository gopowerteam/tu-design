import { describe, expect, it } from "vite-plus/test";
import * as lib from "./index";
import { COMPONENT_NAMES, TuDesignResolver } from "./resolver";

describe("TuDesignResolver", () => {
  const resolver = TuDesignResolver();

  it("TButton 解析为 Button", () => {
    expect(resolver("TButton")).toEqual({ name: "Button", from: "@tu-design/vue" });
  });

  it("TCard 解析为 Card", () => {
    expect(resolver("TCard")).toEqual({ name: "Card", from: "@tu-design/vue" });
  });

  it("已删除的复合子组件不再解析（单组件化收敛）", () => {
    expect(resolver("TCardHeader")).toBeUndefined();
    expect(resolver("TSelectTrigger")).toBeUndefined();
    expect(resolver("TDialogTrigger")).toBeUndefined();
    expect(resolver("TRadioGroupItem")).toBeUndefined();
  });

  it("拒绝无前缀组件名", () => {
    expect(resolver("Button")).toBeUndefined();
  });

  it("拒绝 T 前缀但白名单外的名称（含 Vue 内置 Transition/Teleport）", () => {
    expect(resolver("Transition")).toBeUndefined();
    expect(resolver("Teleport")).toBeUndefined();
    expect(resolver("TFoo")).toBeUndefined();
  });

  it("白名单与组件库组件导出同步（自动识别组件导出）", () => {
    // 组件导出统一是 SFC/defineComponent 产物（setup/render/__name 特征）；函数、常量、
    // cva 工厂与 API 导出自然排除。新增非组件导出无需维护黑名单（旧实现手维护
    // nonComponentExports，新增导出就得改测试，容易与 resolver 漂移）。
    const exported = Object.entries(lib)
      .filter(([, value]) => isComponent(value))
      .map(([name]) => name);
    expect(exported.sort()).toEqual([...COMPONENT_NAMES].sort());
  });
});

function isComponent(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    ("setup" in value || "render" in value || "__name" in value)
  );
}
