# Skeleton

加载占位骨架屏。

## 演示

<DemoPreview file="skeleton/SkeletonDemo.vue" />

## 安装

```bash
npx tu-design add skeleton
```

## Props

| Prop    | 类型     | 默认值 | 说明                                                        |
| ------- | -------- | ------ | ----------------------------------------------------------- |
| `class` | `string` | —      | 控制尺寸/形状（`animate-pulse rounded-md bg-muted` 为基类） |

输出 `aria-hidden="true"` 的占位 `div`，尺寸完全由 `class` 决定。

## 用法

```vue
<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
</script>

<template>
  <div class="flex items-center gap-4">
    <Skeleton class="size-10 rounded-full" />
    <div class="space-y-2">
      <Skeleton class="h-4 w-48" />
      <Skeleton class="h-4 w-32" />
    </div>
  </div>
</template>
```
