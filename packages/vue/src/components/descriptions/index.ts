import { cva, type VariantProps } from "class-variance-authority";

export { default as Descriptions } from "./Descriptions.vue";

/** 描述列表单项数据 */
export interface DescriptionsItemData {
  /** 稳定 key（缺省用数组下标） */
  key?: string | number;
  /** 标签文本；未提供时仍渲染空 dt 占位，保证 dl 分组合法与网格对齐 */
  label?: string;
  /** 内容文本（富内容用 #content 插槽） */
  content?: string | number;
  /** 跨列数，默认 1；非法值回落 1，超出当前行剩余列时被夹紧 */
  span?: number;
}

/** 响应式列数断点（与 Tailwind 默认断点对齐；base 为全部断点未命中时的回落档） */
export type DescriptionsBreakpoint = "base" | "sm" | "md" | "lg" | "xl" | "2xl";

/** 列数配置：固定数字，或按视口断点给出的映射（base 缺省为 1） */
export type DescriptionsColumn = number | Partial<Record<DescriptionsBreakpoint, number>>;

/** 标签对齐方式（仅 labelPlacement="left" 生效） */
export type DescriptionsLabelAlign = "left" | "right" | "center";

/** 容器：bordered 时收成圆角外框（网格线由 body 的 1px 间隙绘制） */
export const descriptionsVariants = cva("w-full", {
  variants: {
    bordered: { true: "overflow-hidden rounded-lg border border-border", false: "" },
  },
  defaultVariants: {
    bordered: false,
  },
});

export type DescriptionsVariants = VariantProps<typeof descriptionsVariants>;

/** 头部：bordered 时与首列单元格左对齐并以底边线衔接网格，否则底部留白 */
export const descriptionsHeaderVariants = cva("flex items-center gap-4", {
  variants: {
    bordered: { true: "border-b border-border", false: "mb-3" },
    size: { sm: "", default: "", lg: "" },
  },
  compoundVariants: [
    { bordered: true, size: "sm", class: "px-2.5 py-1.5" },
    { bordered: true, size: "default", class: "px-3 py-2" },
    { bordered: true, size: "lg", class: "px-4 py-3" },
  ],
  defaultVariants: {
    bordered: false,
    size: "default",
  },
});

export type DescriptionsHeaderVariants = VariantProps<typeof descriptionsHeaderVariants>;

/** 网格主体：bordered 用 1px 间隙透出 bg-border 形成完整表格线，否则为普通间距 */
export const descriptionsBodyVariants = cva("grid", {
  variants: {
    bordered: { true: "gap-px bg-border", false: "gap-x-6 gap-y-4" },
  },
  defaultVariants: {
    bordered: false,
  },
});

export type DescriptionsBodyVariants = VariantProps<typeof descriptionsBodyVariants>;

/**
 * 单项分组（item 自身始终透明，bordered 的线条来自 body 背景在间隙处透出）：
 * - top + bordered：跨 2 条父网格行并 subgrid 化，同一行各项的标签行 / 内容行分别共享，
 *   长标签换行时整排对齐；不支持 subgrid 的浏览器退化为普通堆叠，功能不受影响
 * - left：内部两列网格，bordered 时列间 1px 间隙即标签 / 内容竖线
 */
export const descriptionsItemVariants = cva("min-w-0", {
  variants: {
    labelPlacement: { top: "", left: "" },
    bordered: { true: "", false: "" },
  },
  compoundVariants: [
    { labelPlacement: "top", bordered: false, class: "flex flex-col gap-1" },
    { labelPlacement: "top", bordered: true, class: "grid row-span-2 grid-rows-subgrid" },
    { labelPlacement: "left", bordered: false, class: "grid gap-x-3" },
    { labelPlacement: "left", bordered: true, class: "grid gap-x-px" },
  ],
  defaultVariants: {
    labelPlacement: "top",
    bordered: false,
  },
});

export type DescriptionsItemVariants = VariantProps<typeof descriptionsItemVariants>;

/** 单元格（dt / dd）：字号随 size；底色与 padding 仅 bordered 生效 */
export const descriptionsCellVariants = cva("min-w-0 break-words", {
  variants: {
    role: { label: "", content: "" },
    size: { sm: "text-xs", default: "text-sm", lg: "text-base" },
    bordered: { true: "", false: "" },
  },
  compoundVariants: [
    { role: "label", bordered: false, class: "text-muted-foreground" },
    { role: "content", bordered: false, class: "text-foreground" },
    { role: "label", bordered: true, class: "bg-muted text-muted-foreground" },
    { role: "content", bordered: true, class: "bg-background text-foreground" },
    { bordered: true, size: "sm", class: "px-2.5 py-1.5" },
    { bordered: true, size: "default", class: "px-3 py-2" },
    { bordered: true, size: "lg", class: "px-4 py-3" },
  ],
  defaultVariants: {
    role: "content",
    size: "default",
    bordered: false,
  },
});

export type DescriptionsCellVariants = VariantProps<typeof descriptionsCellVariants>;
