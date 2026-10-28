---
title: ContextMenu 右键菜单
description: 单组件模式的右键菜单，items 描述菜单结构（与 DropdownMenu 同构），右键唤出并定位到指针处，内置键盘导航与选中回调。
---

# ContextMenu

右键菜单：单组件模式，用 `items` 描述菜单结构（`item` / `label` / `separator` / `group` 四种形态，`group` 可嵌套），数据形态与 DropdownMenu 完全同构。默认插槽放触发元素，右键（contextmenu 事件）唤出菜单并定位到指针处。

安装：

```bash
npx tu-design add context-menu
```

::: tip
`context-menu` 复用了 `dropdown-menu` 的类型与渲染实现，CLI 安装时会自动带上 `dropdown-menu` 依赖。
:::

## 基础用法

`items` 声明菜单结构；默认插槽放触发元素本身（ContextTrigger asChild 透传，不额外包裹），在该元素上右键即可唤出菜单：

<DemoPreview file="context-menu/ContextMenuDemo.vue" />

## 分组

`type: "group"` 把语义相关的菜单项归为一组（`label` 同时提供可访问名称），组与组之间用 `separator` 分隔，`children` 内可继续嵌套：

<DemoPreview file="context-menu/ContextMenuGroups.vue" />

## 危险项

危险操作用 `class="text-destructive"` 标红（与 DropdownMenu 的危险项约定一致），`disabled` 置灰禁点：

<DemoPreview file="context-menu/ContextMenuDanger.vue" />

## MenuItemOption

与 DropdownMenu 的 items 类型同构（同一份 `MenuItemOption` 定义）：

| type        | 字段                                 | 说明                             |
| ----------- | ------------------------------------ | -------------------------------- |
| `item`      | `value` `label` `disabled?` `class?` | 菜单项；`value` 是选中回调的标识 |
| `label`     | `label` `class?`                     | 分组标题（纯视觉）               |
| `separator` | `class?`                             | 分隔线                           |
| `group`     | `label?` `class?` `children`         | 分组；`children` 可嵌套任意形态  |

## 无障碍

- 菜单面板基于 Ark UI Menu 原语，保留 `role="menu"` / `role="menuitem"` / `role="group"` 语义与 `aria-disabled` 标记
- 分组标题通过 `aria-labelledby` 与分组建立关联，屏幕阅读器可读
- 菜单打开后焦点进入面板，支持 `↑`/`↓` 移动高亮、`Enter` 选中、`Escape` 关闭
- 触发元素保留自身语义（如 `<button>`），右键交互不改变其角色

## API

### Props

| Prop    | 类型               | 默认值 | 说明           |
| ------- | ------------------ | ------ | -------------- |
| `items` | `MenuItemOption[]` | 必填   | 菜单项描述列表 |

### Events

| 事件     | 载荷                           | 说明                                   |
| -------- | ------------------------------ | -------------------------------------- |
| `select` | `(details: { value: string })` | 菜单项被选中（点击或键盘 Enter）时触发 |

### Slots

| 插槽    | 说明                                        |
| ------- | ------------------------------------------- |
| default | 触发元素本身（ContextTrigger asChild 透传） |

## 说明

- 右键（contextmenu 事件）唤出菜单，菜单定位到指针位置；移动端长按同样可唤出
- 触发元素上通过 `preventDefault` 屏蔽浏览器原生右键菜单
- 选中后默认关闭菜单；挂在根组件上的额外 attrs（`class`、`data-*` 等）会透传到菜单面板
- 进出场动画基于 `data-[state]` + `tw-animate-css`
- 开合状态由 Ark 内部管理，不提供 `v-model:open`（右键菜单无受控诉求，需要时直接用 `@ark-ui/vue` 的 Menu 原语组合）

## 主题定制

ContextMenu 面板样式与 DropdownMenu 同源，由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                          |
| ------------------------------------ | --------------------------------------------- |
| `--popover` / `--popover-foreground` | 菜单面板底色/文字                             |
| `--accent` / `--accent-foreground`   | 菜单项高亮态（`data-[highlighted]`）底色/文字 |
| `--muted`                            | 分隔线颜色（`bg-muted`）                      |
| `--destructive`                      | 危险项文字色（`text-destructive`）            |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--popover: oklch(0.98 0.01 260)">
  <ContextMenu :items="items">…</ContextMenu>
</div>
```
