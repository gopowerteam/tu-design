---
title: Switch 开关
description: 开关：基于 Ark UI Switch 原语，滑块动效由 data-[state] + transition 驱动。
---

# Switch

开关：基于 Ark UI Switch 原语，滑块动效由 `data-[state]` + transition 驱动。

安装：

```bash
npx tu-design add switch
```

## 基础用法

<DemoPreview file="switch/SwitchDemo.vue" />

## 受控用法

`v-model:checked` 双向绑定开关状态；不传时为非受控（初始值用 `default-checked`）：

<DemoPreview file="switch/SwitchControlled.vue" />

## 禁用

<DemoPreview file="switch/SwitchDisabled.vue" />

## 组件结构

Switch 为单组件，无子组件；滑块动效由 `data-[state]` + `transition-transform` 驱动，无 cva 变体。

## API

### Props

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:checked` | `boolean` | —       | 开关状态；不传为非受控 |
| `default-checked` | `boolean` | `false` | 非受控时的初始状态     |
| `disabled`        | `boolean` | `false` | 禁用                   |
| `class`           | `string`  | —       | 追加/覆盖根样式        |

### Events

| 事件             | 载荷                 | 说明       |
| ---------------- | -------------------- | ---------- |
| `update:checked` | `(checked: boolean)` | 开关态变化 |

### Slots

| 插槽      | 说明                                     |
| --------- | ---------------------------------------- |
| `default` | 标签文字，渲染在开关右侧，点击同样可切换 |

## 主题定制

Switch 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量           | 用途                                       |
| -------------- | ------------------------------------------ |
| `--primary`    | 开启态轨道底色（`data-[state=checked]`）   |
| `--input`      | 关闭态轨道底色（`data-[state=unchecked]`） |
| `--ring`       | 键盘聚焦环（`ring-ring/50`）               |
| `--background` | 滑块（Thumb）底色                          |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TSwitch v-model:checked="enabled" />
</div>
```
