---
title: Spin 加载中
description: 加载中旋转指示器，支持独立 spinner 与包裹内容（半透明遮罩）两种形态。
---

# Spin

加载中旋转指示器。纯 CSS 实现（Tailwind `animate-spin`），内联 SVG 圆环（`stroke: currentColor`），无 Ark 原语依赖。

安装：

```bash
npx tu-design add spin
```

## 基础用法

独立 spinner，常与文字提示组合：

<DemoPreview file="spin/SpinDemo.vue" />

## 尺寸

三种内置尺寸：`sm`（16px）、`default`（24px）、`lg`（32px）：

<DemoPreview file="spin/SpinSizesDemo.vue" />

## 包裹态

给 `Spin` 提供默认插槽内容即进入包裹态：内容常驻渲染，`spinning=true` 时叠加半透明遮罩（`bg-background/60`）并居中显示 spinner，加载完成后遮罩消失、内容恢复交互（参考 Ant Design Spin 的包裹形态）：

<DemoPreview file="spin/SpinWrapDemo.vue" />

## 组件结构

Spin 为单文件组件，无子组件；尺寸用 cva 变体（`spinVariants`），颜色固定 `text-primary`（暗色模式随 token 自动适配）。遮罩使用 `rounded-[inherit]`，会跟随包裹容器的圆角。

## API

### Props

| Prop       | 类型                        | 默认值    | 说明                                        |
| ---------- | --------------------------- | --------- | ------------------------------------------- |
| `size`     | `'sm' \| 'default' \| 'lg'` | `default` | spinner 尺寸（16 / 24 / 32px）              |
| `spinning` | `boolean`                   | `true`    | 是否处于加载中                              |
| `label`    | `string`                    | `加载中`  | 无障碍标签（`role="status"` 的 aria-label） |
| `class`    | `string`                    | —         | 根元素附加 class                            |

### Events

Spin 不声明自定义事件，原生事件随 attrs 透传到根元素。

### Slots

| Slot    | 说明                                                                                   |
| ------- | -------------------------------------------------------------------------------------- |
| default | 提供内容即进入包裹态；不提供则为独立 spinner。独立态下 `spinning=false` 不渲染任何内容 |

## 无障碍

- 加载元素带 `role="status"` 与 `aria-label`（默认「加载中」，可用 `label` 覆写），`aria-busy` 仅挂在该状态元素上并同步 `spinning`，屏幕阅读器会播报加载状态（根元素不重复声明，避免双重播报）。
- 包裹态下 `spinning=true` 时根元素置 `inert`：被遮罩的内容无法聚焦、点击或滚动，Tab 焦点不会落入遮挡区域；`spinning=false` 时 `inert` 解除、内容恢复交互。
- 遮罩仅在 `spinning=true` 时渲染，`spinning=false` 时 DOM 中不存在状态元素。

## 主题定制

Spin 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量           | 用途                       |
| -------------- | -------------------------- |
| `--primary`    | spinner 前景色             |
| `--background` | 包裹态遮罩底色（60% 透明） |

旋转动画为 `animate-spin` 工具类，不依赖 CSS 变量，暗色模式随 token 自动适配。
