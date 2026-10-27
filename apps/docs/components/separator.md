---
title: Separator 分隔线
description: 分隔线，支持水平与垂直方向。
---

# Separator

分隔线，支持水平与垂直方向。

安装：

```bash
npx tu-design add separator
```

## 基础用法

::: tip
垂直方向需要父容器有确定高度（组件自身 `h-full w-px`）。
:::

<DemoPreview file="separator/SeparatorDemo.vue" />

## 组件结构

Separator 为单组件，无子组件；不使用 cva，方向类由 `orientation` 计算生成（`horizontal` 为 `h-px w-full`，`vertical` 为 `w-px h-full`）。

## API

### Props

| Prop          | 类型                         | 默认值         | 说明                                |
| ------------- | ---------------------------- | -------------- | ----------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向（`data-orientation` 同步输出） |
| `class`       | `string`                     | —              | 追加/覆盖样式（经 `cn` 合并）       |

### Events

Separator 不声明自定义事件，原生事件随 attrs 透传到根元素。

### Slots

Separator 不声明自定义插槽：其渲染为自闭合的 `<div>`，无内容区。

## 主题定制

Separator 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量       | 用途       |
| ---------- | ---------- |
| `--border` | 分隔线底色 |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--border: oklch(0.7 0.05 260)">
  <TSeparator />
</div>
```
