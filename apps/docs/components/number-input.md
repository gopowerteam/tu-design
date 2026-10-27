---
title: NumberInput 数字输入
description: 数字输入框：内置加减步进按钮与数值边界，值以 number | null 受控（空值归一为 null）。
---

# NumberInput

数字输入框：内置加减步进按钮与数值边界，值以 `number | null` 受控（空值归一为 `null`）。

安装：

```bash
npx tu-design add number-input
```

## 基础用法

`min`/`max` 夹取边界，`step` 供按钮与键盘 ↑↓ 共用；清空或输入非法值时归一为 `null`：

<DemoPreview file="number-input/NumberInputDemo.vue" />

## 边界与步长

手动输入越界值会在失焦时被夹取回边界；`step` 同时作用于按钮点击与键盘 ↑↓：

<DemoPreview file="number-input/NumberInputStepDemo.vue" />

## 格式化展示

`formatOptions` 接受任意 `Intl.NumberFormatOptions`，仅影响展示，存储值不变：

<DemoPreview file="number-input/NumberInputFormat.vue" />

## 自定义步进图标

`decrement` / `increment` 插槽替换默认的加减图标（图标需自带尺寸与 `aria-hidden`）：

<DemoPreview file="number-input/NumberInputSlotsDemo.vue" />

## 状态

`disabled` 时步进按钮与输入同时禁用；`invalid` 套 destructive 样式：

<DemoPreview file="number-input/NumberInputStates.vue" />

## 组件结构

NumberInput 基于 Ark `NumberInput` 原语组装：Root 容器（承载边框/校验态）+ `DecrementTrigger`/`IncrementTrigger` 步进按钮 + 内部真实 `Input` 三段式结构；样式为内联类组合（无 cva 变体），attrs 透传到内部真实 `input`。

## API

### Props

| 项              | 类型                       | 说明                                            |
| --------------- | -------------------------- | ----------------------------------------------- |
| `v-model`       | `number \| null`           | 数值；空输入/非法输入归一为 `null`              |
| `min` / `max`   | `number`                   | 数值边界（越界输入被夹取）                      |
| `step`          | `number`                   | 步长（按钮与键盘 ↑↓ 共用），默认 `1`            |
| `formatOptions` | `Intl.NumberFormatOptions` | 展示格式（如 `{ notation: "percent" }`）        |
| `disabled`      | `boolean`                  | 禁用态（`data-disabled`）                       |
| `invalid`       | `boolean`                  | 校验失败态（`data-invalid` + destructive 样式） |
| `class`         | `string`                   | 追加/覆盖样式（经 `cn` 合并）                   |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部真实 `input`，供 `TFormLabel`/`TFormControl` 关联。

### Events

| 事件                | 载荷                      | 说明                               |
| ------------------- | ------------------------- | ---------------------------------- |
| `update:modelValue` | `(value: number \| null)` | 值变化；空输入/非法输入归一 `null` |

`focus`、`blur` 等原生事件随 attrs 透传到内部真实 `input`。

### Slots

| 插槽        | 作用域 | 说明                            |
| ----------- | ------ | ------------------------------- |
| `decrement` | —      | 减号按钮内容（默认内置 − 图标） |
| `increment` | —      | 加号按钮内容（默认内置 + 图标） |

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`（`id` 自动落到内部 input）：

<DemoPreview file="number-input/NumberInputFormDemo.vue" />

## 主题定制

NumberInput 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                                      |
| -------------------- | ----------------------------------------- |
| `--input`            | Root 默认边框色（`border-input`）         |
| `--radius`           | 圆角基准（`rounded-md` 派生）             |
| `--destructive`      | 校验失败态边框与环（`data-invalid:*`）    |
| `--muted`            | 步进按钮底色（`bg-muted/50`）             |
| `--accent`           | 步进按钮 hover 底色（`hover:bg-accent`）  |
| `--muted-foreground` | 步进按钮图标色（`text-muted-foreground`） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--accent: oklch(0.55 0.18 260)">
  <TNumberInput v-model="count" />
</div>
```
