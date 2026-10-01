# Slider

滑块：基于 Ark UI Slider 原语，支持单值与区间、键盘微调。

## 演示

<DemoPreview file="slider/SliderDemo.vue" />

## 安装

```bash
npx tu-design add slider
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const price = ref([20, 80]);
</script>

<template>
  <!-- 单值 -->
  <TSlider v-model="volume" :max="100" />
  <!-- 区间（数组语义，值恒为 number[]） -->
  <TSlider v-model="price" :min="0" :max="200" :step="10" />
</template>
```

## Props

| Prop                   | 类型                 | 默认值        | 说明                                        |
| ---------------------- | -------------------- | ------------- | ------------------------------------------- |
| `v-model`              | `number[]`           | —             | 当前值（恒为数组，单值传 `[n]` 或直接 `n`） |
| `default-value`        | `number \| number[]` | —             | 非受控时的初始值                            |
| `min` / `max` / `step` | `number`             | `0 / 100 / 1` | 范围与步进                                  |
| `disabled`             | `boolean`            | `false`       | 禁用                                        |

## 说明

- `update:modelValue` 载荷恒为 `number[]`（与 zag 一致）
- 键盘 `←`/`→`/`↑`/`↓` 按 `step` 微调，`PageUp`/`PageDown` 大步进
