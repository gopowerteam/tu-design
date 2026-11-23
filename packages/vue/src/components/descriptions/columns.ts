import type { DescriptionsBreakpoint, DescriptionsColumn, DescriptionsItemData } from "./index";

type MediaBreakpoint = Exclude<DescriptionsBreakpoint, "base">;

/** Tailwind 默认断点 min-width（px），与 sm: / md: / lg: / xl: / 2xl: 工具类口径一致 */
export const DESCRIPTIONS_BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const satisfies Record<MediaBreakpoint, number>;

/** 断点键按 min-width 降序（命中判定从宽到窄） */
const MEDIA_BREAKPOINTS_DESC: MediaBreakpoint[] = (
  Object.keys(DESCRIPTIONS_BREAKPOINTS) as MediaBreakpoint[]
).sort((a, b) => DESCRIPTIONS_BREAKPOINTS[b] - DESCRIPTIONS_BREAKPOINTS[a]);

/** 打包后的单元格：span 为最终生效值（已夹紧 / 拉伸），index 保持原始下标 */
export interface PackedDescriptionsItem {
  item: DescriptionsItemData;
  index: number;
  span: number;
}

/** packRows 的结果 */
export interface PackedDescriptionsRows {
  /** 按行分组；每行 span 之和恒等于 columns */
  rows: PackedDescriptionsItem[][];
  /** 是否发生过「span 超出行剩余列」的夹紧（DEV 提示用；末项拉伸不计入） */
  clamped: boolean;
}

/**
 * 把任意值净化为不小于 1 的整数（列数 / span 共用）；非有限数回落 1。
 * @param value - 原始数值
 * @returns 不小于 1 的整数
 */
function toPositiveInt(value: unknown): number {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? Math.max(1, Math.trunc(num)) : 1;
}

/**
 * 解析当前生效列数：数字直接采用；断点对象取「min-width 不超过视口宽度的最大断点」，
 * 全部未命中回落 base（缺省 1）。服务端 / 首帧传 0 可稳定得到 base 档。
 * @param column - 列数配置（数字或断点映射）
 * @param viewportWidth - 视口宽度（px）
 * @returns 不小于 1 的整数列数
 */
export function resolveColumn(column: DescriptionsColumn, viewportWidth: number): number {
  if (typeof column !== "object" || column === null) return toPositiveInt(column);
  for (const key of MEDIA_BREAKPOINTS_DESC) {
    const value = column[key];
    if (value !== undefined && viewportWidth >= DESCRIPTIONS_BREAKPOINTS[key]) {
      return toPositiveInt(value);
    }
  }
  return toPositiveInt(column.base);
}

/**
 * 行打包：按列数把 items 切成若干行，并确定每项最终 span。
 * - span 净化为不小于 1 的整数，且不超过列数
 * - 放不进当前行剩余列时夹到剩余列并封行（避免空洞，bordered 网格线保持对齐）
 * - 末行不足时拉伸最后一项补满（与 antd 行为一致）
 * 不修改入参；结果保证每行 span 之和恰等于 columns。
 * @param items - 原始数据源
 * @param columns - 当前行列数（非法值按 1 处理）
 * @returns 分行结果与是否发生过夹紧
 */
export function packRows(
  items: readonly DescriptionsItemData[],
  columns: number,
): PackedDescriptionsRows {
  const total = toPositiveInt(columns);
  const rows: PackedDescriptionsItem[][] = [];
  let row: PackedDescriptionsItem[] = [];
  let used = 0;
  let clamped = false;

  items.forEach((item, index) => {
    const requested = toPositiveInt(item.span);
    // 循环内 used 恒小于 total，rest 至少为 1
    const rest = total - used;
    const span = Math.min(requested, rest);
    if (span < requested) clamped = true;
    row.push({ item, index, span });
    used += span;
    if (used === total) {
      rows.push(row);
      row = [];
      used = 0;
    }
  });

  if (row.length > 0) {
    row[row.length - 1]!.span += total - used;
    rows.push(row);
  }
  return { rows, clamped };
}
