import type { Ref } from "vue";
import { ref } from "vue";

/** 行高兜底：表头行 class 为 h-10（2.5rem = 40px）；happy-dom 下 offsetHeight 恒 0 */
export const HEADER_ROW_FALLBACK = 40;

/** useHeaderMeasurement 入参 */
export interface HeaderMeasurementOptions {
  /** 虚拟滚动是否启用（缺省 () => true）：false 时 theadOffset 不写入（保持 0） */
  virtualEnabled?: () => boolean;
}

/** useHeaderMeasurement 返回物 */
export interface HeaderMeasurement {
  /** 表头行元素（模板 ref 收集，逐行求高度） */
  rowEls: Ref<(HTMLElement | null)[]>;
  /** 各行顶部偏移（前缀和）：多行 sticky 表头逐行钉住，避免顶边重叠 */
  rowTop: Ref<number[]>;
  /** 滚动容器内 thead 占据的前缀高度（virtual 的 scrollMargin） */
  theadOffset: Ref<number>;
  /** 唯一测量入口：测量所有表头行高度并派生 rowTop / theadOffset */
  measure: () => void;
}

/**
 * 多行表头测量：行顶偏移与 thead 总高（唯一测量源）。
 *
 * 两处口径有意区分：
 * - `rowTop`（多行 sticky 逐行 top）用兜底 h-10（40px）——测量不可用时避免表头行重叠；
 * - `theadOffset`（virtual 的 scrollMargin）用**实测原值**，与既有行为一致
 *   （happy-dom 无布局 → 0；真实浏览器 → 真实高度）。
 * @param options - 可选 virtualEnabled getter（缺省视为启用）
 * @returns 行元素收集、行顶偏移、thead 前缀高度与测量函数
 */
export function useHeaderMeasurement(options: HeaderMeasurementOptions = {}): HeaderMeasurement {
  const virtualEnabled = options.virtualEnabled ?? (() => true);
  const rowEls = ref<(HTMLElement | null)[]>([]);
  const rowTop = ref<number[]>([]);
  const theadOffset = ref(0);

  /** 测量所有表头行高度并派生行顶偏移与 thead 总高 */
  function measure() {
    const raw = rowEls.value.map((el) => el?.offsetHeight ?? 0);
    const heights = raw.map((height) => height || HEADER_ROW_FALLBACK);
    rowTop.value = heights.map((_, index) => heights.slice(0, index).reduce((a, h) => a + h, 0));
    if (virtualEnabled()) theadOffset.value = raw.reduce((a, h) => a + h, 0);
  }

  return { rowEls, rowTop, theadOffset, measure };
}
