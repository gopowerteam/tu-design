---
title: Input 输入框
description: 文本输入框，支持 v-model 与 attrs 透传。
---

# Input

文本输入框，支持 v-model 与 attrs 透传。

安装：

```bash
npx tu-design add input
```

## 基础用法

`v-model` 双向绑定，`placeholder`、`type` 等 attrs 直接透传到原生 `<input>`：

<DemoPreview file="input/InputDemo.vue" />

## 原生类型与事件

`maxlength`、`autocomplete` 等原生属性，以及 `keydown.enter` 等原生事件，全部随 attrs 透传，无需额外 API：

<DemoPreview file="input/InputTypesDemo.vue" />

> 需要密码显隐切换时，使用专用组件 [PasswordInput](/components/password-input) 而非 `type="password"`。

## 状态

`disabled`（经 attrs 透传）、`readonly` 与 `invalid`（输出 `aria-invalid` 并套 destructive 样式）对比。注意三者语义不同：禁用不可聚焦，只读可聚焦可复制，校验态只影响视觉与 aria：

<DemoPreview file="input/InputStatesDemo.vue" />

> **注意**：`invalid` 只负责视觉与 aria 状态，校验逻辑需配合 [Form](/components/form) 自行实现。

## 组件结构

Input 为单组件，无子组件；纯样式封装（无需原语），也没有 cva 变体，样式为单个 `<input>` 元素上的固定类组合。

## API

### Props

| 项        | 类型               | 说明                                            |
| --------- | ------------------ | ----------------------------------------------- |
| `v-model` | `string \| number` | 输入值（`defineModel`）                         |
| `invalid` | `boolean`          | 校验失败态（`aria-invalid` + destructive 样式） |
| `class`   | `string`           | 追加/覆盖样式（经 `cn` 合并）                   |

其余原生属性（`type`、`placeholder`、`disabled` 等）通过 `attrs` 透传到 `<input>`。

### Events

Input 未声明额外事件：`v-model` 对应 `update:modelValue`；`focus`、`blur`、`keydown` 等原生事件随 attrs 透传到根 `<input>`：

```vue
<template>
  <TInput placeholder="搜索" @keydown.enter="onSearch" />
</template>
```

### Slots

Input 不声明自定义插槽：根元素为原生 `<input>` 自闭合元素，没有可承载插槽内容的子节点，占位文本等经 `placeholder` 等 attrs/props 传入。

## 主题定制

Input 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量            | 用途                                   |
| --------------- | -------------------------------------- |
| `--input`       | 默认边框色（`border-input`）           |
| `--ring`        | 焦点边框与焦点环（`ring-ring/50`）     |
| `--destructive` | 校验失败态边框与环（`aria-invalid:*`） |
| `--radius`      | 圆角基准（`rounded-md` 派生）          |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--input: oklch(0.55 0.18 260)">
  <TInput placeholder="品牌色边框" />
</div>
```
