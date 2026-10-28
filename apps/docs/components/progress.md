---
title: Progress 进度条
description: 进度条：基于 Ark UI Progress 原语，支持语义色、标签与百分比显示、不确定态。
---

# Progress

进度条：基于 Ark UI Progress 原语，支持语义色、标签与百分比显示、不确定态。

安装：

```bash
npx tu-design add progress
```

## 基础用法

`label` 展示标签，`v-model:value` 受控绑定当前值（0 ~ max）：

<DemoPreview file="progress/ProgressDemo.vue" />

## 受控用法

外部状态驱动进度，`update:value` 同步回写（载荷为 `number | null`）：

<DemoPreview file="progress/ProgressControlled.vue" />

## 语义色

`type` 映射语义 token：`default` 用 primary，`info`/`success`/`warning` 用对应语义色，`error` 映射 `destructive`：

<DemoPreview file="progress/ProgressTypesDemo.vue" />

## 显示百分比与自定义量程

`show-value` 显示百分比文本（按 `max` 归一），`max` 自定义量程上限：

<DemoPreview file="progress/ProgressShowValueDemo.vue" />

## 不确定态

无法预知进度时设 `indeterminate`（或显式 `value` 传 `null`），进度条以脉冲动画呈现，aria 不再暴露 `aria-valuenow`：

<DemoPreview file="progress/ProgressIndeterminateDemo.vue" />

## 组件结构

Progress 为单组件，无子组件；内部组合 `@ark-ui/vue` 的 Progress 原语（`Root`/`Label`/`Track`/`Range`/`ValueText`）。无障碍语义由 Ark 保留：`role="progressbar"` 与 `aria-valuemin`/`aria-valuemax`/`aria-valuenow` 挂载在 Track 上，根元素携带 `data-value`/`data-state`（`loading`/`indeterminate`/`complete`）。

## API

### Props

| Prop            | 类型                                                       | 默认值      | 说明                                           |
| --------------- | ---------------------------------------------------------- | ----------- | ---------------------------------------------- |
| `v-model:value` | `number \| null`                                           | —           | 当前值；显式传 `null` 为不确定态               |
| `max`           | `number`                                                   | `100`       | 量程上限                                       |
| `label`         | `string`                                                   | —           | 进度标签文本                                   |
| `show-value`    | `boolean`                                                  | `false`     | 是否显示百分比文本                             |
| `type`          | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 语义色                                         |
| `indeterminate` | `boolean`                                                  | `false`     | 不确定态（忽略 `value`，恒以 `null` 传给 Ark） |
| `class`         | `string`                                                   | —           | 追加/覆盖根元素样式类                          |

### Events

| 事件           | 载荷                      | 说明                          |
| -------------- | ------------------------- | ----------------------------- |
| `update:value` | `(value: number \| null)` | 值变化；不确定态载荷为 `null` |

### Slots

Progress 不声明自定义插槽。

## 说明

- 进度条为纯展示组件，值只能由外部驱动（无键盘/指针交互）
- `show-value` 的百分比由 Ark 按 locale 格式化（默认 `en-US`，`40` → `40%`）
- 不确定态下 ValueText 渲染为空，range 以固定半宽脉冲动画呈现（`data-[state=indeterminate]` 驱动）

## 主题定制

Progress 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                          |
| -------------------- | ----------------------------- |
| `--muted`            | 滑轨底色（`bg-muted`）        |
| `--primary`          | `type="default"` 进度条填充色 |
| `--info`             | `type="info"` 进度条填充色    |
| `--success`          | `type="success"` 进度条填充色 |
| `--warning`          | `type="warning"` 进度条填充色 |
| `--destructive`      | `type="error"` 进度条填充色   |
| `--foreground`       | 标签文本色                    |
| `--muted-foreground` | 百分比文本色                  |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TProgress :value="60" />
</div>
```
