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

## API

### Props

| Prop    | 类型     | 默认值 | 说明                                                        |
| ------- | -------- | ------ | ----------------------------------------------------------- |
| `class` | `string` | —      | 控制尺寸/形状（`animate-pulse rounded-md bg-muted` 为基类） |

输出 `aria-hidden="true"` 的占位 `div`，尺寸完全由 `class` 决定。
