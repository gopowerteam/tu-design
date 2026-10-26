---
title: Button 按钮
description: 带变体与尺寸的按钮，支持 as 标签切换与 asChild 组合。
---

# Button

带变体与尺寸的按钮，支持 `as` 标签切换与 `asChild` 组合。

安装：

```bash
npx tu-design add button
```

## 基础用法

<DemoPreview file="button/ButtonDemo.vue" />

## 变体

<DemoPreview file="button/ButtonVariants.vue" />

## 尺寸

<DemoPreview file="button/ButtonSizes.vue" />

## 图标

<DemoPreview file="button/ButtonIcon.vue" />

## 链接形态

<DemoPreview file="button/ButtonLink.vue" />

## asChild 组合

`asChild` 时不渲染 `button` 元素，而是把变体类与 attrs 合并到默认插槽的第一个子元素上（基于 `Slot` 原语）。适合子元素自带语义的场景（如 `<a>`、路由链接组件）；此时 `as` 与 `icon` 插槽不生效，子元素自身的 class 可覆盖变体类（经 `cn` 冲突合并）。

<DemoPreview file="button/ButtonAsChild.vue" />

## 组件结构

Button 为单组件，无子组件；变体类由 `buttonVariants`（cva）统一生成。

## API

### Props

| Prop      | 类型                                                                          | 默认值      | 说明                             |
| --------- | ----------------------------------------------------------------------------- | ----------- | -------------------------------- |
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | `'default'` | 视觉变体                         |
| `size`    | `'default' \| 'sm' \| 'lg' \| 'icon'`                                         | `'default'` | 尺寸（`icon` 为正方形 `size-9`） |
| `as`      | `string`                                                                      | `'button'`  | 渲染的元素标签，如 `"a"`         |
| `asChild` | `boolean`                                                                     | `false`     | 以子元素为渲染目标               |
| `class`   | `string`                                                                      | —           | 追加/覆盖样式（经 `cn` 合并）    |

### Events

Button 不声明自定义事件，`click`、`focus` 等原生事件随 attrs 透传到根元素（`asChild` 时透传到子元素）：

```vue
<template>
  <TButton @click="onSubmit">提交</TButton>
</template>
```

### Slots

| 插槽      | 说明                           |
| --------- | ------------------------------ |
| `default` | 按钮内容                       |
| `icon`    | 前置图标（`asChild` 时不生效） |

## 主题定制

Button 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                     | 用途                                       |
| ---------------------------------------- | ------------------------------------------ |
| `--primary` / `--primary-foreground`     | `default` 变体底色/文字；`link` 变体文字色 |
| `--destructive`                          | `destructive` 变体底色                     |
| `--secondary` / `--secondary-foreground` | `secondary` 变体底色/文字                  |
| `--background`                           | `outline` 变体底色；焦点环偏移底色         |
| `--input`                                | `outline` 变体边框色                       |
| `--muted`                                | `ghost` / `outline` hover 底色             |
| `--ring`                                 | 焦点环颜色                                 |
| `--radius`                               | 圆角基准（`rounded-lg` 派生）              |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TButton>品牌色按钮</TButton>
</div>
```
