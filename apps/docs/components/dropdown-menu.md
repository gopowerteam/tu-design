---
title: DropdownMenu 下拉菜单
description: 单组件模式的下拉菜单，items 描述菜单结构，内置键盘导航、typeahead 高亮与选中回调。
---

# DropdownMenu

下拉菜单：单组件模式，用 `items` 描述菜单结构（`item` / `label` / `separator` / `group` 四种形态，`group` 可嵌套），内置键盘导航、typeahead 高亮与选中回调。

安装：

```bash
npx tu-design add dropdown-menu
```

## 基础用法

`items` 声明菜单结构；默认插槽放触发元素本身（行为直接合并到该元素上，不额外包裹）。`disabled` 置灰禁点，危险操作可用 `class="text-destructive"` 标色：

<DemoPreview file="dropdown-menu/DropdownMenuDemo.vue" />

## 分组

`type: "group"` 把语义相关的菜单项归为一组（`label` 同时提供可访问名称，屏幕阅读器可读），组与组之间用 `separator` 分隔，`children` 内可继续嵌套：

<DemoPreview file="dropdown-menu/DropdownMenuGroups.vue" />

## 选中事件

`select` 在菜单项被选中（点击或键盘 Enter）时回传 `{ value }`：

<DemoPreview file="dropdown-menu/DropdownMenuSelect.vue" />

## 自定义菜单项（#item 插槽）

需要快捷键提示、图标等自定义内容时，用 `#item` 插槽接管菜单项渲染（仍包在真实菜单项内，键盘导航与 `select` 行为保留）：

<DemoPreview file="dropdown-menu/DropdownMenuItemSlot.vue" />

## MenuItemOption

| type        | 字段                                 | 说明                             |
| ----------- | ------------------------------------ | -------------------------------- |
| `item`      | `value` `label` `disabled?` `class?` | 菜单项；`value` 是选中回调的标识 |
| `label`     | `label` `class?`                     | 分组标题（纯视觉）               |
| `separator` | `class?`                             | 分隔线                           |
| `group`     | `label?` `class?` `children`         | 分组；`children` 可嵌套任意形态  |

## API

### Props

| Prop                             | 类型               | 默认值  | 说明                   |
| -------------------------------- | ------------------ | ------- | ---------------------- |
| `items`                          | `MenuItemOption[]` | 必填    | 菜单项描述列表         |
| `v-model:open`                   | `boolean`          | —       | 受控开关；不传为非受控 |
| `default-open`                   | `boolean`          | `false` | 非受控时的初始状态     |
| `lazy-mount` / `unmount-on-exit` | `boolean`          | `false` | 内容挂载策略           |
| `trigger-class`                  | `string`           | —       | 追加到触发元素的样式   |
| `content-class`                  | `string`           | —       | 追加到菜单面板的样式   |

### Events

| 事件          | 载荷                           | 说明                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| `update:open` | `(open: boolean)`              | 开关状态变化（`v-model:open`）         |
| `select`      | `(details: { value: string })` | 菜单项被选中（点击或键盘 Enter）时触发 |

### Slots

| 插槽    | 作用域                                       | 说明                                     |
| ------- | -------------------------------------------- | ---------------------------------------- |
| default | —                                            | 触发元素本身（asChild 透传，无额外包裹） |
| `#item` | `{ item }`（`item` 形态的 `MenuItemOption`） | 自定义菜单项渲染的逃生口                 |

## 说明

- 点击菜单项前需要先悬停高亮（真实交互的自然顺序），键盘 `↑`/`↓`/`Enter` 同样可用
- 选中后默认关闭菜单
- 未提供 `value` 的 `item` 会自动生成内部标识
- 子菜单暂未纳入 `items` 描述，需要时直接用 `@ark-ui/vue` 的 Menu 原语组合
- 挂在根组件上的额外 attrs（`class`、`data-*` 等）会透传到菜单面板
- 进出场动画基于 `data-[state]` + `tw-animate-css`

## 主题定制

DropdownMenu 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                          |
| ------------------------------------ | --------------------------------------------- |
| `--popover` / `--popover-foreground` | 菜单面板底色/文字                             |
| `--accent` / `--accent-foreground`   | 菜单项高亮态（`data-[highlighted]`）底色/文字 |
| `--muted`                            | 分隔线颜色（`bg-muted`）                      |
| `--radius`                           | 圆角基准（`rounded-md`/`rounded-sm` 派生）    |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--popover: oklch(0.98 0.01 260)">
  <TDropdownMenu :items="items">…</TDropdownMenu>
</div>
```
