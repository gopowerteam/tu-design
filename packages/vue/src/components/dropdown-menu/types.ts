/** DropdownMenu 菜单项描述：四种形态，group 可嵌套 children 形成层级 */
export type MenuItemOption =
  | { type: "item"; value: string; label: string; disabled?: boolean; class?: string }
  | { type: "label"; label: string; class?: string }
  | { type: "separator"; class?: string }
  | { type: "group"; label?: string; class?: string; children: MenuItemOption[] };
