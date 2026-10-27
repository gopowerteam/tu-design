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

`v-model` 双向绑定，`maxlength` 等原生属性直接透传，可配合字数计数使用：

<DemoPreview file="textarea/TextareaDemo.vue" />

## 高度与自适应

组件内置 `field-sizing-content`：在支持的浏览器中高度随内容自动增长（`min-h-16` 起步）；需要固定高度时用 `class` 覆盖（如 `h-24`），超出内容滚动：

<DemoPreview file="textarea/TextareaSizingDemo.vue" />

## 状态

`disabled`、`readonly` 与 `invalid` 对比；`invalid` 输出 `aria-invalid` 并套 destructive 样式：

<DemoPreview file="textarea/TextareaStatesDemo.vue" />

## 组件结构

## 组件结构

Textarea 为单组件，无子组件；纯样式封装（无需原语），也没有 cva 变体，样式为原生 `<textarea>` 元素上的固定类组合。

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

### Slots

Textarea 不声明自定义插槽：组件模板未使用 `<slot>`，输入内容完全经 `v-model`/原生属性表达，不提供插槽子内容。

## 主题定制

Textarea 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量            | 用途                                   |
| --------------- | -------------------------------------- |
| `--input`       | 默认边框色（`border-input`）           |
| `--ring`        | 焦点边框与焦点环（`ring-ring/50`）     |
| `--destructive` | 校验失败态边框与环（`aria-invalid:*`） |
| `--radius`      | 圆角基准（`rounded-md` 派生）          |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--input: oklch(0.55 0.18 260)">
  <TTextarea placeholder="品牌色边框" />
</div>
```
