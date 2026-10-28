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

  it("白名单与组件库组件导出同步（排除非组件导出）", () => {
    // 非组件值导出：utils 函数、cva variants 工厂、resolver 自身、form-render/table-render API
    const nonComponentExports = new Set([
      "cn",
      "avatarVariants",
      "avatarGroupKey",
      "badgeVariants",
      "buttonVariants",
      "cardVariants",
      "COMPONENT_NAMES",
      "TuDesignResolver",
      "numberOrNull",
      "formatCurrency",
      "parseCurrency",
      "defineForm",
      "useFormRender",
      "widgetRenders",
      "bindField",
      "CHECKED",
      "MODEL_VALUE",
      "SLIDER",
      "VALUE",
      "defineTable",
      "defineColumns",
      "useTableRender",
      "columnRenders",
      "useToast",
      "alertVariants",
      "alertIconVariants",
      "alertIconPaths",
    ]);
    const exported = Object.keys(lib).filter((k) => !nonComponentExports.has(k));
    expect(exported.sort()).toEqual([...COMPONENT_NAMES].sort());
  });
});
