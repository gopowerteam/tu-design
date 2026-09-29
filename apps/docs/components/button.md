# Button

带变体与尺寸的按钮，支持 as 标签切换。

## 演示

<DemoPreview file="button/ButtonDemo.vue" />

## 安装

```bash
npx tu-design add button
```

## Props

| Prop      | 类型                                                                          | 默认值      | 说明                             |
| --------- | ----------------------------------------------------------------------------- | ----------- | -------------------------------- |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | 视觉变体                         |
| `size`    | `'default' \| 'sm' \| 'lg' \| 'icon'`                                         | `'default'` | 尺寸（`icon` 为正方形 `size-9`） |
| `as`      | `string`                                                                      | `'button'`  | 渲染的元素标签，如 `"a"`         |
| `class`   | `string`                                                                      | —           | 追加/覆盖样式（经 `cn` 合并）    |

## 用法

### 变体

<DemoPreview file="button/ButtonVariants.vue" />

### 尺寸

```vue
<script setup lang="ts">
import { Button } from "@/components/ui/button";
</script>

<template>
  <Button size="sm">Small</Button>
  <Button size="lg">Large</Button>
  <Button size="icon">AI</Button>
</template>
```

### 链接形态

```vue
<template>
  <Button as="a" variant="link" href="https://example.com">打开链接</Button>
</template>
```
