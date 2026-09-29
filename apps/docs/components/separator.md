# Separator

分隔线，支持水平与垂直方向。

## 演示

<DemoPreview file="separator/SeparatorDemo.vue" />

## 安装

```bash
npx tu-design add separator
```

## Props

| Prop          | 类型                         | 默认值         | 说明                                |
| ------------- | ---------------------------- | -------------- | ----------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向（`data-orientation` 同步输出） |
| `class`       | `string`                     | —              | 追加/覆盖样式（经 `cn` 合并）       |

::: tip
垂直方向需要父容器有确定高度（组件自身 `h-full w-px`）。
:::

## 用法

```vue
<script setup lang="ts">
import { Separator } from "@/components/ui/separator";
</script>

<template>
  <div class="flex flex-col gap-4">
    <span>上方内容</span>
    <Separator />
    <span>下方内容</span>
  </div>
</template>
```
