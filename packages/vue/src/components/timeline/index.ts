import { cva, type VariantProps } from "class-variance-authority";

export { default as Timeline } from "./Timeline.vue";

/** 时间轴单项数据 */
export interface TimelineItemData {
  /** 事件标题 */
  title?: string;
  /** 事件描述文本 */
  content?: string;
  /** 时间戳文案（纯展示，不解析日期） */
  timestamp?: string;
  /** 时间戳位置：内容上方（默认）或内容下方 */
  timestampPlacement?: "top" | "bottom";
  /** 节点颜色（语义 token） */
  dotColor?: "primary" | "success" | "warning" | "destructive" | "muted";
  /** 空心节点（描边 + 背景填充，颜色跟随 dotColor） */
  hollow?: boolean;
}

/** 容器变体：alternate 模式加 isolate 隔离堆叠上下文，避免连线/节点受外部 z-index 干扰 */
export const timelineVariants = cva("relative m-0 list-none p-0", {
  variants: {
    mode: {
      right: "",
      alternate: "isolate",
    },
  },
  defaultVariants: {
    mode: "right",
  },
});

export type TimelineVariants = VariantProps<typeof timelineVariants>;

/** 项变体：li 的 last:pb-0 相对 ol 语义正确；首末项连线裁切在模板内按 index 计算，不用伪类 */
export const timelineItemVariants = cva("relative grid items-start last:pb-0", {
  variants: {
    mode: {
      right: "",
      alternate: "",
    },
    size: {
      default: "pb-8",
      sm: "pb-6",
    },
  },
  compoundVariants: [
    { mode: "right", size: "default", class: "grid-cols-[12px_minmax(0,1fr)]" },
    { mode: "right", size: "sm", class: "grid-cols-[10px_minmax(0,1fr)]" },
    {
      mode: "alternate",
      size: "default",
      class: "grid-cols-[minmax(0,1fr)_12px_minmax(0,1fr)]",
    },
    { mode: "alternate", size: "sm", class: "grid-cols-[minmax(0,1fr)_10px_minmax(0,1fr)]" },
  ],
  defaultVariants: {
    mode: "right",
    size: "default",
  },
});

export type TimelineItemVariants = VariantProps<typeof timelineItemVariants>;

/** 节点变体：hollow × color 经 compoundVariants 配对出边框色，实心直接配底色 */
export const timelineDotVariants = cva("relative z-10 mt-1 block shrink-0 rounded-full", {
  variants: {
    mode: {
      right: "col-start-1",
      alternate: "col-start-2 row-start-1",
    },
    size: {
      default: "size-3",
      sm: "size-2.5 mt-[5px]",
    },
    color: {
      primary: "",
      success: "",
      warning: "",
      destructive: "",
      muted: "",
    },
    hollow: {
      true: "border-2 bg-background",
      false: "",
    },
  },
  compoundVariants: [
    { hollow: false, color: "primary", class: "bg-primary" },
    { hollow: false, color: "success", class: "bg-success" },
    { hollow: false, color: "warning", class: "bg-warning" },
    { hollow: false, color: "destructive", class: "bg-destructive" },
    { hollow: false, color: "muted", class: "bg-muted-foreground" },
    { hollow: true, color: "primary", class: "border-primary" },
    { hollow: true, color: "success", class: "border-success" },
    { hollow: true, color: "warning", class: "border-warning" },
    { hollow: true, color: "destructive", class: "border-destructive" },
    { hollow: true, color: "muted", class: "border-muted-foreground" },
  ],
  defaultVariants: {
    mode: "right",
    size: "default",
    color: "primary",
    hollow: false,
  },
});

export type TimelineDotVariants = VariantProps<typeof timelineDotVariants>;
