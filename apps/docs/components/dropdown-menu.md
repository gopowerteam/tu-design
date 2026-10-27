---
title: DropdownMenu 下拉菜单
description: 基于 Ark UI Menu 的下拉菜单，内置键盘导航、类型ahead 高亮与选中回调。
---

# DropdownMenu

下拉菜单：基于 Ark UI Menu 原语，内置键盘导航、类型ahead 高亮与选中回调。`TDropdownMenuTrigger` 支持 `asChild`。

安装：

```bash
npx tu-design add dropdown-menu
```

## 基础用法

`TDropdownMenu`（根，状态容器）+ `TDropdownMenuTrigger`（打开）+ `TDropdownMenuContent`（面板），菜单项用 `TDropdownMenuItem`，配合 `TDropdownMenuLabel` / `TDropdownMenuSeparator` 分组。

<DemoPreview file="dropdown-menu/DropdownMenuDemo.vue" />

## 选中事件

`select` 挂在 `TDropdownMenu` 根组件上，菜单项被选中（点击或键盘 Enter）时回传 `{ value }`：

<DemoPreview file="dropdown-menu/DropdownMenuSelect.vue" />

## 组件结构

| 组件                     | 说明                                 |
| ------------------------ | ------------------------------------ |
| `TDropdownMenu`          | 根组件，状态容器（`v-model:open`）   |
| `TDropdownMenuTrigger`   | 触发打开，支持 `asChild`             |
| `TDropdownMenuContent`   | 菜单面板                             |
| `TDropdownMenuItem`      | 菜单项                               |
| `TDropdownMenuLabel`     | 分组标题（纯视觉）                   |
| `TDropdownMenuSeparator` | 分隔线                               |
| `TDropdownMenuGroup`     | 可访问分组（`label` 提供可访问名称） |

## API

### Props

#### TDropdownMenu

| Prop                             | 类型      | 默认值  | 说明                   |
| -------------------------------- | --------- | ------- | ---------------------- |
| `v-model:open`                   | `boolean` | —       | 受控开关；不传为非受控 |
| `default-open`                   | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount` / `unmount-on-exit` | `boolean` | `false` | 内容挂载策略           |

#### TDropdownMenuItem

| Prop       | 类型      | 默认值   | 说明                 |
| ---------- | --------- | -------- | -------------------- |
| `value`    | `string`  | 自动生成 | 选中回调里回传的标识 |
| `disabled` | `boolean` | `false`  | 禁用项               |
| `class`    | `string`  | —        | 追加/覆盖样式        |

#### TDropdownMenuGroup

| Prop    | 类型     | 默认值 | 说明             |
| ------- | -------- | ------ | ---------------- |
| `label` | `string` | —      | 分组的可访问名称 |

#### TDropdownMenuTrigger / 其他

`asChild` 用法同 Dialog；`TDropdownMenuLabel`（分组标题）、`TDropdownMenuSeparator`（分隔线）均为轻量包装并接受 `class` 追加/覆盖样式，`TDropdownMenuContent` 同样接受 `class`。

### Events

`select` 挂在 `TDropdownMenu` 根组件上；`TDropdownMenuItem` 自身未声明事件，`@select` 会经 attrs 透传到 Ark 原语 `Item`（同样可用，不带载荷）：

| 事件          | 载荷                           | 说明                                   |
| ------------- | ------------------------------ | -------------------------------------- |
| `update:open` | `(open: boolean)`              | 开关状态变化（`v-model:open`）         |
| `select`      | `(details: { value: string })` | 菜单项被选中（点击或键盘 Enter）时触发 |

### Slots

全部子组件均只提供默认插槽，内容直接写在标签内，无命名插槽。

## 说明

- 点击菜单项前需要先悬停高亮（真实交互的自然顺序），键盘 `↑`/`↓`/`Enter` 同样可用
- 选中后默认关闭菜单（Ark 原语 `close-on-select` 可调）
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
  <TDropdownMenu>…</TDropdownMenu>
</div>
```
