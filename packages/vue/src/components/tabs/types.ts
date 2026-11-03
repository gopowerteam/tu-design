/** 单个标签页配置项 */
export interface TabItem {
  /** 唯一标识，同时作为触发按钮与面板的 value */
  value: string;
  /** 触发按钮文案 */
  label: string;
  /** 是否禁用该标签（禁用项不参与键盘导航） */
  disabled?: boolean;
  /** 面板级覆盖：首次激活才挂载（缺省回落组件级 lazyMount） */
  lazyMount?: boolean;
  /** 面板级覆盖：切走即卸载（缺省回落组件级 unmountOnExit） */
  unmountOnExit?: boolean;
  /** 追加到触发按钮的样式类 */
  class?: string;
  /** 显示关闭按钮；点击仅发出 close 事件，移除 items 由使用方处理 */
  closable?: boolean;
}
