---
title: Slider 滑块
description: 滑块：基于 Ark UI Slider 原语，支持单值与区间、键盘微调。
---

# Slider

滑块：基于 Ark UI Slider 原语，支持单值与区间、键盘微调。

安装：

```bash
npx tu-design add slider
```

## 基础用法

`default-value` 非受控，单值传 `n`、区间传数组：

<DemoPreview file="slider/SliderDemo.vue" />

## 受控用法

`v-model` 绑定 `number[]`（载荷恒为数组，与 Ark 一致）：

<DemoPreview file="slider/SliderControlled.vue" />

## 组件结构

Slider 为单组件，无子组件；内部组合 `@ark-ui/vue` 的 Slider 原语（`Root`/`Control`/`Track`/`Range`/`Thumb`/`HiddenInput`）。Thumb 数量由值数组长度驱动：单值 `n` 内部归一为 `[n]`，区间传数组即渲染多个 Thumb。

## API

### Props

| Prop                   | 类型                 | 默认值        | 说明                                        |
| ---------------------- | -------------------- | ------------- | ------------------------------------------- |
| `v-model`              | `number[]`           | —             | 当前值（恒为数组，单值传 `[n]` 或直接 `n`） |
| `default-value`        | `number \| number[]` | —             | 非受控时的初始值                            |
| `min` / `max` / `step` | `number`             | `0 / 100 / 1` | 范围与步进                                  |
| `disabled`             | `boolean`            | `false`       | 禁用                                        |

### Events

| 事件                | 载荷                | 说明                                       |
| ------------------- | ------------------- | ------------------------------------------ |
| `update:modelValue` | `(value: number[])` | 值变化；载荷恒为 `number[]`（与 Ark 一致） |

### Slots

Slider 不声明自定义插槽。

## 说明

- `update:modelValue` 载荷恒为 `number[]`（与 Ark 一致）
- 键盘 `←`/`→`/`↑`/`↓` 按 `step` 微调，`PageUp`/`PageDown` 大步进

## 主题定制

Slider 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量           | 用途                           |
| -------------- | ------------------------------ |
| `--muted`      | 滑轨底色（`bg-muted`）         |
| `--primary`    | 已选区间条与 Thumb 边框色      |
| `--background` | Thumb 底色                     |
| `--ring`       | Thumb 聚焦环（`ring-ring/50`） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TSlider v-model="value" />
</div>
```
