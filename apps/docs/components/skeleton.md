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
