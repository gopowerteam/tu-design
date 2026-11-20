export interface StickyInfo {
  side: "left" | "right";
  offset: number;
  edge: boolean;
}

export type StickyMap = Map<string, StickyInfo>;

/**
 * sticky 定位样式；head 为 true 时 z-index 高于表体（表头压住表体 sticky）
 * @param sticky - 列 key → sticky 信息的映射
 * @param key - 列 key
 * @param head - 是否为表头单元格（true 使用更高的 --z-sticky-head）
 * @returns inline style 对象；列非 sticky 时返回 undefined
 */
export function stickyStyle(sticky: StickyMap, key: string, head = false) {
  const info = sticky.get(key);
  if (!info) return undefined;
  return {
    position: "sticky" as const,
    [info.side]: `${info.offset}px`,
    zIndex: head ? "var(--z-sticky-head)" : "var(--z-sticky)",
  };
}

/** stickyClass 行为开关（边框/条纹正交模型的传导参数） */
export interface StickyClassOptions {
  /**
   * 列线开启：列间边界由统一列线（td/th 的 border-r）绘制，stickyClass 抑制交界边框——
   * separate 模型下前格 border-r 与 sticky 交界 border-l 会贴叠成 2px 双线，必须二选一
   */
  columnLines?: boolean;
  /**
   * 奇数条纹行：不透明底换 muted/30 与 background 的 color-mix 固色——
   * 保持防滚动透出的不透明性（bg-muted/30 是半透明，sticky 列透出滚动内容），与 tr 层条纹视觉对齐
   */
  striped?: boolean;
}

/**
 * sticky 底色（防滚动透出）与交界分隔边框
 * @param sticky - 列 key → sticky 信息的映射
 * @param key - 列 key
 * @param opts - 行为开关：columnLines 抑制交界边框（统一列线接管）；striped 输出不透明条纹固色
 * @returns class 列表（未命中项为空串）；列非 sticky 时返回 undefined
 */
export function stickyClass(sticky: StickyMap, key: string, opts: StickyClassOptions = {}) {
  const info = sticky.get(key);
  if (!info) return undefined;
  return [
    opts.striped
      ? "bg-[color-mix(in_oklab,var(--color-muted)_30%,var(--color-background))]"
      : "bg-background",
    !opts.columnLines && info.side === "left" && info.edge ? "border-r border-border" : "",
    !opts.columnLines && info.side === "right" && info.edge ? "border-l border-border" : "",
  ];
}
