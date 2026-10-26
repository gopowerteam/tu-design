---
title: Textarea 文本域
description: 多行文本输入：纯样式封装（无需原语），支持 invalid 校验态与原生属性透传。
---

# Textarea

多行文本输入：纯样式封装（无需原语），支持 invalid 校验态与原生属性透传。

安装：

```bash
npx tu-design add textarea
```

## 基础用法

<DemoPreview file="textarea/TextareaDemo.vue" />

## 受控用法

`v-model` 双向绑定输入值：

<DemoPreview file="textarea/TextareaControlled.vue" />

## API

### Props

| Prop      | 类型               | 默认值 | 说明                                            |
| --------- | ------------------ | ------ | ----------------------------------------------- |
| `v-model` | `string \| number` | —      | 输入值                                          |
| `invalid` | `boolean`          | —      | 校验失败态（`aria-invalid` + destructive 样式） |
| `class`   | `string`           | —      | 追加/覆盖根样式                                 |

其余原生属性（`placeholder`/`rows`/`disabled` 等）经透传直接生效。

### Events

Textarea 未声明额外事件：`v-model` 对应 `update:modelValue`；`focus`、`blur` 等原生事件随 attrs 透传到根 `<textarea>`。
