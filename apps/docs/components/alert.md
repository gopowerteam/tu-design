---
title: Alert 警告提示
description: 语义化警示条，支持五种变体、内置图标与可关闭交互。
---

# Alert

用于页面内展示需要引起注意的静态信息，不打断用户操作。

安装：

```bash
npx tu-design add alert
```

## 基础用法

不传 `variant` 时为中性 default 样式：

<DemoPreview file="alert/AlertVariants.vue" />

## 变体说明

- `default`（默认）：中性卡片样式，用于普通提示；
- `info`：`--color-info` 语义蓝，用于说明性信息；
- `success`：`--color-success` 语义绿，用于成功反馈；
- `warning`：`--color-warning` 语义橙，用于风险提示；
- `error`：`--color-destructive` 语义红，用于错误告警（此时组件自动携带 `role="alert"`）。

背景与边框使用 `color-mix` 将语义色与透明背景混合，暗色模式下自动跟随 token 变量。

## 可关闭

设置 `closable` 显示关闭按钮，点击后隐藏并触发 `close` 事件；也可用 `v-model` 受控显隐：

<DemoPreview file="alert/AlertClosable.vue" />

## 自定义插槽

提供四个插槽：`icon`（覆盖内置图标）、`title`（覆盖标题）、`default`（描述内容，优先于 `description` prop）、`close`（替换关闭按钮）：

<DemoPreview file="alert/AlertSlots.vue" />

<DemoPreview file="alert/AlertCustom.vue" />

## 组件结构

Alert 为一体式单组件，无 Trigger/Content 子组件；变体类由 `alertVariants`（cva）统一生成。

## 无障碍

- 容器默认 `role="status"`；`variant="error"` 时为 `role="alert"`；
- 图标标记 `aria-hidden="true"`，关闭按钮带 `aria-label="关闭"`。

## API

### Props

| Prop          | 类型                                                       | 默认值      | 说明                          |
| ------------- | ---------------------------------------------------------- | ----------- | ----------------------------- |
| `variant`     | `'default' \| 'info' \| 'success' \| 'warning' \| 'error'` | `'default'` | 语义变体                      |
| `title`       | `string`                                                   | —           | 标题（可被 `title` 插槽覆盖） |
| `description` | `string`                                                   | —           | 描述（可被 default 插槽覆盖） |
| `closable`    | `boolean`                                                  | `false`     | 显示关闭按钮                  |
| `showIcon`    | `boolean`                                                  | `true`      | 显示变体内置图标              |
| `class`       | `string`                                                   | —           | 追加/覆盖样式（经 `cn` 合并） |

### Events

| 事件    | 说明                         |
| ------- | ---------------------------- |
| `close` | 点击关闭按钮后触发，同时隐藏 |

### Slots

| 插槽      | 说明                 |
| --------- | -------------------- |
| `default` | 描述/正文内容        |
| `title`   | 覆盖标题             |
| `icon`    | 覆盖内置图标         |
| `close`   | 替换默认关闭按钮区域 |

### v-model

| 绑定         | 类型      | 默认值 | 说明     |
| ------------ | --------- | ------ | -------- |
| `modelValue` | `boolean` | `true` | 受控显隐 |

## 主题定制

Alert 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                   | 用途                    |
| -------------------------------------- | ----------------------- |
| `--info` / `--success` / `--warning`   | 对应变体的语义色        |
| `--destructive`                        | `error` 变体语义色      |
| `--card` / `--border` / `--foreground` | `default` 变体底色/边框 |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--info: oklch(0.55 0.15 200)">
  <TAlert variant="info" title="定制信息色">…</TAlert>
</div>
```
