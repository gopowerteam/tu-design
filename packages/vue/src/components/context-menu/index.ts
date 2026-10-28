export { default as ContextMenu } from "./ContextMenu.vue";
// items 类型与 dropdown-menu 同构：直接 re-export 其 MenuItemOption，保持单一事实来源
export type { MenuItemOption } from "../dropdown-menu";
