import type { Ref } from "vue";
import { ref } from "vue";

/** 面板锚点坐标（fixed 定位；恒含 0 尺寸宽高） */
export interface ColumnSettingsAnchorStyle extends Record<string, string> {
  position: "fixed";
  width: "0";
  height: "0";
  left: string;
  top: string;
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
 * @returns 初始 fixed 锚点样式
 */
function initialAnchor(): ColumnSettingsAnchorStyle {
  return { position: "fixed", width: "0", height: "0", left: "0px", top: "0px" };
}

/**
 * 列设置面板开合控制：受控开放状态 + 锚点坐标计算（纯逻辑，不持有 DOM）。
 * @returns 开合状态、高亮 key、锚点样式与动作
 */
export function useColumnSettingsController(): ColumnSettingsController {
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
    const { left, top } = resolvePoint(target);
    highlightKey.value = columnKey;
    anchorStyle.value = {
      position: "fixed",
      width: "0",
      height: "0",
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    };
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
