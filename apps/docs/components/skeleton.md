---
title: Skeleton 骨架屏
description: 加载占位骨架屏。
---

# Skeleton

加载占位骨架屏。

安装：

```bash
npx tu-design add skeleton
```

## 基础用法

<DemoPreview file="skeleton/SkeletonDemo.vue" />

## 组合模式

Skeleton 的价值在组合：用多个骨架块拼出与真实界面同构的占位结构。

### 卡片骨架

<DemoPreview file="skeleton/SkeletonCardDemo.vue" />

### 列表骨架

<DemoPreview file="skeleton/SkeletonListDemo.vue" />

## 形状与尺寸

Skeleton 无内置变体，`rounded-full`、`rounded-lg`、比例宽度等 class 组合即得任意形状：

<DemoPreview file="skeleton/SkeletonShapesDemo.vue" />

## 加载切换

骨架屏的典型用途：请求期间展示骨架，完成后切换到真实内容。两侧结构一致，切换不跳动：

<DemoPreview file="skeleton/SkeletonToggleDemo.vue" />

## 组件结构

Skeleton 为单组件，无子组件；不使用 cva，样式为固定工具类（`animate-pulse rounded-md bg-muted`）加 `class` 合并。

## API

### Props

| Prop    | 类型     | 默认值 | 说明                                                        |
| ------- | -------- | ------ | ----------------------------------------------------------- |
| `class` | `string` | —      | 控制尺寸/形状（`animate-pulse rounded-md bg-muted` 为基类） |

输出 `aria-hidden="true"` 的占位 `div`，尺寸完全由 `class` 决定。

### Events

Skeleton 不声明自定义事件，原生事件随 attrs 透传到根元素。

### Slots

Skeleton 不声明自定义插槽：其渲染为 `aria-hidden="true"` 的空占位 `<div>`，无内容区。

## 主题定制

Skeleton 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量      | 用途     |
| --------- | -------- |
| `--muted` | 骨架底色 |

脉冲动画为 `animate-pulse` 工具类，不依赖 CSS 变量。在任意容器上覆盖即得到作用域主题：

```html
<div style="--muted: oklch(0.9 0.02 260)">
  <TSkeleton class="size-10 rounded-full" />
</div>
```
