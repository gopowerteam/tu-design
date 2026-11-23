/** 浮层锚点定位策略：普通文档用 absolute（随表格滚动）；iframe 沙箱退 fixed（规避包含块错位） */
export type OverlayAnchorPosition = "absolute" | "fixed";

/** 浮层锚点样式：0 尺寸元素，仅承载定位坐标 */
export interface OverlayAnchorStyle extends Record<string, string> {
  position: OverlayAnchorPosition;
  width: "0";
  height: "0";
  left: string;
  top: string;
}

/**
 * 视口坐标 → 表格根节点相对坐标（根节点需 `position: relative`）。
 * 根节点缺失时原样返回，避免未挂载阶段抛错。
 * @param root - 表格根节点
 * @param left - 视口 x 坐标
 * @param top - 视口 y 坐标
 * @returns 根节点相对坐标（未取整）
 */
export function toRootPoint(
  root: HTMLElement | undefined,
  left: number,
  top: number,
): { left: number; top: number } {
  if (!root) return { left, top };
  const rect = root.getBoundingClientRect();
  return { left: left - rect.left, top: top - rect.top };
}

/**
 * 生成锚点内联样式：absolute 走根节点相对坐标，fixed 走视口坐标（沙箱回退）。
 * @param point - 目标点（按 position 语义：absolute 时需已换算为根相对）
 * @param position - 定位策略
 * @returns 0 尺寸锚点样式（px 取整）
 */
export function buildAnchorStyle(
  point: { left: number; top: number },
  position: OverlayAnchorPosition,
): OverlayAnchorStyle {
  return {
    position,
    width: "0",
    height: "0",
    left: `${Math.round(point.left)}px`,
    top: `${Math.round(point.top)}px`,
  };
}
