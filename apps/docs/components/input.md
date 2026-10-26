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

`v-model` 双向绑定，配合 `type` 等原生属性使用：

<DemoPreview file="input/InputDemo.vue" />

## 禁用与校验态

`disabled` 等原生属性经 attrs 透传；`invalid` 输出 `aria-invalid` 并套 destructive 样式：

<DemoPreview file="input/InputStates.vue" />

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
