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

## 说明

- `update:modelValue` 载荷恒为 `number[]`（与 Ark 一致）
- 键盘 `←`/`→`/`↑`/`↓` 按 `step` 微调，`PageUp`/`PageDown` 大步进
