# Button

带变体与尺寸的按钮，支持 as 标签切换与 asChild 组合。

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
| `asChild` | `boolean`                                                                     | `false`     | 以子元素为渲染目标（见下方说明） |
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
  <TButton size="sm">Small</TButton>
  <TButton size="lg">Large</TButton>
  <TButton size="icon">AI</TButton>
</template>
```

### 链接形态

```vue
<template>
  <TButton as="a" variant="link" href="https://example.com">打开链接</TButton>
</template>
```

### asChild 组合

`asChild` 时不渲染 `button` 元素，而是把变体类与 attrs 合并到默认插槽的第一个子元素上（基于 `Slot` 原语）。适合子元素自带语义的场景（如 `<a>`、路由链接组件）；此时 `as` 与 `icon` 插槽不生效，子元素自身的 class 可覆盖变体类（经 `cn` 冲突合并）。

<DemoPreview file="button/ButtonAsChild.vue" />

```vue
<template>
  <TButton as-child>
    <a href="https://example.com">打开链接</a>
  </TButton>
</template>
```
