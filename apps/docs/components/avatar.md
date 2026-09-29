# Avatar

头像，含图片加载与回退（Ark UI）。

## 演示

<DemoPreview file="avatar/AvatarDemo.vue" />

## 安装

```bash
npx tu-design add avatar
```

## Props

| Prop    | 类型     | 默认值 | 说明                                          |
| ------- | -------- | ------ | --------------------------------------------- |
| `src`   | `string` | —      | 头像图片地址；加载失败或未提供时渲染 Fallback |
| `alt`   | `string` | —      | 图片替代文本                                  |
| `class` | `string` | —      | 追加/覆盖样式（经 `cn` 合并）                 |

## Slots

| 插槽      | 说明                                                |
| --------- | --------------------------------------------------- |
| `default` | Fallback 内容（图片不可用时显示，通常为文字或图标） |

## 用法

```vue
<script setup lang="ts">
import { Avatar } from "@/components/ui/avatar";
</script>

<template>
  <Avatar src="/avatar.png" alt="用户头像">ZC</Avatar>
</template>
```

::: info
组件基于 `@ark-ui/vue` 的 Avatar 无头实现，需安装 `@ark-ui/vue` 依赖（CLI 会提示）。
:::
