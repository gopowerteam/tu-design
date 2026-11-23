import type { Ref } from "vue";
import { ref } from "vue";
import { buildAnchorStyle, toRootPoint } from "./anchor-point";
import type { OverlayAnchorPosition, OverlayAnchorStyle } from "./anchor-point";

/** 面板锚点坐标（absolute = 根节点相对；fixed = 视口坐标；恒含 0 尺寸宽高） */
export type ColumnSettingsAnchorStyle = OverlayAnchorStyle;

/** 列设置控制器选项 */
export interface ColumnSettingsControllerOptions {
  /** 表格根节点（absolute 定位基准；缺失时退视口坐标） */
  getRoot?: () => HTMLElement | undefined;
  /** 定位策略：iframe 沙箱返回 fixed（默认 absolute） */
  anchorPosition?: () => OverlayAnchorPosition;
}

/** 列设置开合控制器 */
export interface ColumnSettingsController {
  open: Ref<boolean>;
  /** 打开来源列 key（表头入口用于高亮；工具栏入口为 undefined） */
  highlightKey: Ref<string | undefined>;
  anchorStyle: Ref<ColumnSettingsAnchorStyle>;
  /**
   * 在指定位置打开面板。
   * HTMLElement → getBoundingClientRect() 左下角；
   * MouseEvent → currentTarget 的 rect（无有效 rect 时回退 clientX/clientY）。
   * @param target - 触发元素或事件
   * @param columnKey - 可选来源列 key（高亮）
   */
  openAt(target: MouseEvent | HTMLElement, columnKey?: string): void;
  /** 已开则关，否则在 target 处打开 */
  toggle(target: MouseEvent | HTMLElement, columnKey?: string): void;
  close(): void;
}

/**
 * 默认锚点样式：左上角，0 尺寸
 * @returns 初始锚点样式（absolute 根相对 0,0）
 */
function initialAnchor(): ColumnSettingsAnchorStyle {
  return buildAnchorStyle({ left: 0, top: 0 }, "absolute");
}

/**
 * 列设置面板开合控制：受控开放状态 + 锚点坐标计算（纯逻辑，不持有 DOM）。
 * @param options - 根节点与定位策略（沙箱回退 fixed）
 * @returns 开合状态、高亮 key、锚点样式与动作
 */
export function useColumnSettingsController(
  options?: ColumnSettingsControllerOptions,
): ColumnSettingsController {
  const open = ref(false);
  const highlightKey = ref<string | undefined>(undefined);
  const anchorStyle = ref<ColumnSettingsAnchorStyle>(initialAnchor());

  /**
   * 解析目标坐标（左下角）：元素/事件 currentTarget 的 rect；无有效 rect 回退鼠标坐标
   * @param target - 元素或鼠标事件
   * @returns 左下角坐标（四舍五入 px）
   */
  function resolvePoint(target: MouseEvent | HTMLElement): { left: number; top: number } {
    const isEvent = typeof (target as MouseEvent).clientX === "number";
    if (!isEvent) {
      const rect = (target as HTMLElement).getBoundingClientRect();
      return { left: rect.left, top: rect.bottom };
    }
    const event = target as MouseEvent;
    const current = event.currentTarget;
    if (current instanceof HTMLElement) {
      const rect = current.getBoundingClientRect();
      // happy-dom / 未布局元素 rect 全 0：视为无效，回退鼠标坐标
      if (rect.left !== 0 || rect.top !== 0 || rect.width !== 0 || rect.height !== 0) {
        return { left: rect.left, top: rect.bottom };
      }
    }
    return { left: event.clientX, top: event.clientY };
  }

  /**
   * 打开面板并写入锚点坐标
   * @param target - 触发元素或事件
   * @param columnKey - 可选来源列 key
   */
  function openAt(target: MouseEvent | HTMLElement, columnKey?: string) {
    const position = options?.anchorPosition?.() ?? "absolute";
    const point = resolvePoint(target);
    highlightKey.value = columnKey;
    anchorStyle.value = buildAnchorStyle(
      position === "fixed" ? point : toRootPoint(options?.getRoot?.(), point.left, point.top),
      position,
    );
    open.value = true;
  }

  /**
   * 切换开合：已开则关闭，否则在目标处打开
   * @param target - 触发元素或事件
   * @param columnKey - 可选来源列 key
   */
  function toggle(target: MouseEvent | HTMLElement, columnKey?: string) {
    if (open.value) close();
    else openAt(target, columnKey);
  }

  /** 关闭面板（保留锚点与高亮，仅翻转 open） */
  function close() {
    open.value = false;
  }

  return { open, highlightKey, anchorStyle, openAt, toggle, close };
}
