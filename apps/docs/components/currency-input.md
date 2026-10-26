---
title: CurrencyInput 金额输入
description: 金额输入框：内置单位后缀，界面输入单位与存储单位（万/元/角/分）自动换算，值以 number | null 受控。
---

# CurrencyInput

金额输入框：纯输入框 + 内置单位后缀，`labelUnit`（界面输入单位）与 `valueUnit`（存储单位）支持 `万`/`元`/`角`/`分` 自动换算。输入 1.5 万，`v-model` 得到 `15000`（元）。

安装：

```bash
npx tu-design add currency-input
```

## 基础用法

界面按「万」输入，`v-model` 以「元」存储：

<DemoPreview file="currency-input/CurrencyInputDemo.vue" />

## 单位换算

`labelUnit` 与 `valueUnit` 可自由组合，换算方向双向：外部赋值会反算回显：

<DemoPreview file="currency-input/CurrencyInputUnits.vue" />

## API

### Props

| 项            | 类型                           | 默认   | 说明                                        |
| ------------- | ------------------------------ | ------ | ------------------------------------------- |
| `v-model`     | `number \| null`               | `null` | 存储值（`valueUnit` 单位），空输入归一 null |
| `labelUnit`   | `"万" \| "元" \| "角" \| "分"` | `"元"` | 界面输入单位（同时作为后缀展示）            |
| `valueUnit`   | `"万" \| "元" \| "角" \| "分"` | `"元"` | 存储单位（v-model 值的单位）                |
| `placeholder` | `string`                       | —      | 输入框占位符                                |
| `disabled`    | `boolean`                      | —      | 禁用态                                      |
| `invalid`     | `boolean`                      | —      | 校验失败态（`data-invalid` + destructive）  |
| `class`       | `string`                       | —      | 追加/覆盖样式（经 `cn` 合并）               |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

### Events

| 事件                | 载荷                      | 说明                               |
| ------------------- | ------------------------- | ---------------------------------- |
| `update:modelValue` | `(value: number \| null)` | 值变化；空输入/非法输入归一 `null` |

`focus`、`blur` 等原生事件随 attrs 透传到内部 `input`。

## 与表单集成

<DemoPreview file="currency-input/CurrencyInputFormDemo.vue" />

## 换算规则

- 内部以**整数分**为最小精度：换算先转分、四舍五入到整数分、再按 `valueUnit` 除回（`valueUnit="分"` 时输出恒为整数）。
- 换算基于十进制字符串移位，无浮点误差（`0.29` 元 → `29` 分，而非 `28.99…`）。
- 输入白名单为非负数字文本；负号或非法字符（如 `-5`、`1.2.3`）视为无效，`v-model` 输出 `null`，范围校验交给表单 validators。
- 外部赋值会反算回显：`modelValue=15000`（元）在 `labelUnit="万"` 下输入框显示 `1.5`。
