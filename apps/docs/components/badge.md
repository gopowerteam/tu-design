# Badge

轻量状态徽标，支持四种变体。

## 演示

<DemoPreview file="badge/BadgeDemo.vue" />

## 安装

```bash
npx tu-design add badge
```

## Props

| Prop      | 类型                                                     | 默认值      | 说明                          |
| --------- | -------------------------------------------------------- | ----------- | ----------------------------- |
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | 视觉变体                      |
| `class`   | `string`                                                 | —           | 追加/覆盖样式（经 `cn` 合并） |

## 用法

```vue
<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
</script>

<template>
  <TBadge>Default</TBadge>
  <TBadge variant="secondary">Secondary</TBadge>
  <TBadge variant="destructive">Destructive</TBadge>
  <TBadge variant="outline">Outline</TBadge>
</template>
```
