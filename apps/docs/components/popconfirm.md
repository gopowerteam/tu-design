---
title: Popconfirm 气泡确认
description: 轻量气泡确认框，点击触发元素弹出，支持异步确认与危险操作变体。
---

# Popconfirm

用于需要用户二次确认的轻量操作（删除、发布、注销等），点击触发元素弹出气泡，不打断页面上下文。

安装：

```bash
npx tu-design add popconfirm
```

安装会自动携带依赖：`popover`、`button`、`utils`。

## 基础用法

默认插槽即触发元素本体，确认/取消点击后气泡自动关闭并派发对应事件：

<DemoPreview file="popconfirm/PopconfirmBasic.vue" />

## 危险操作

设置 `variant="destructive"` 让确认按钮使用 destructive 危险色，适用于删除、注销等不可逆操作：

<DemoPreview file="popconfirm/PopconfirmDestructive.vue" />

## 异步确认

`@confirm` 处理器返回 Promise 时，确认按钮进入 loading，期间锁定全部关闭通道（ESC、点击外部、触发器、取消按钮）；resolve 后自动关闭，reject 保持打开便于重试：

<DemoPreview file="popconfirm/PopconfirmAsync.vue" />

## 组件结构

Popconfirm 为一体式单组件，是 [Popover](/components/popover) 的薄壳变体：触发器 asChild 合并、受控桥、定位与进出场动画均复用 Popover 实现，面板内容（标题/描述/操作按钮）由组件内置，不暴露 `#content` 插槽。

## 无障碍

- 面板标题经 Ark Popover `Title` 渲染，content 自动接线 `aria-labelledby`；
- 传入 `description` 时经 `Description` 渲染，content 自动接线 `aria-describedby`；
- Promise pending 期间确认/取消按钮置为 `disabled`，loading 图标标记 `aria-hidden="true"`。

## API

### Props

| Prop          | 类型                         | 默认值      | 说明                                        |
| ------------- | ---------------------------- | ----------- | ------------------------------------------- |
| `title`       | `string`                     | —           | 气泡标题（必填）                            |
| `description` | `string`                     | —           | 气泡描述（可选）                            |
| `confirmText` | `string`                     | `'确定'`    | 确认按钮文案                                |
| `cancelText`  | `string`                     | `'取消'`    | 取消按钮文案                                |
| `variant`     | `'default' \| 'destructive'` | `'default'` | 确认按钮风格                                |
| `open`        | `boolean \| undefined`       | —           | 受控开关（配合 `v-model:open`），不传非受控 |

### Events

| 事件          | 说明                                                  |
| ------------- | ----------------------------------------------------- |
| `update:open` | 开关状态变化时触发                                    |
| `confirm`     | 点击确认后触发；处理器返回 Promise 时进入异步确认流程 |
| `cancel`      | 点击取消后触发，同时自动关闭                          |

### Slots

| 插槽      | 说明         |
| --------- | ------------ |
| `default` | 触发元素本体 |

### v-model

| 绑定   | 类型      | 说明                 |
| ------ | --------- | -------------------- |
| `open` | `boolean` | 气泡显隐（受控开关） |

## 主题定制

样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                         | 用途                          |
| ---------------------------- | ----------------------------- |
| `--popover` / `--foreground` | 面板底色/前景色（含暗色适配） |
| `--muted-foreground`         | 描述文案颜色                  |
| `--primary`                  | `default` 变体确认按钮        |
| `--destructive`              | `destructive` 变体确认按钮    |
