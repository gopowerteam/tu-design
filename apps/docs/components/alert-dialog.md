---
title: AlertDialog 确认弹窗
description: 模态确认弹窗一体式单组件，确认/取消双按钮，支持危险操作语义与异步确认锁定。
---

# AlertDialog

确认弹窗：基于 Ark UI Dialog 原语的**单组件**——内置标题、描述与「取消 / 确认」双按钮，`v-model:open` 控制显隐，`@confirm` / `@cancel` 处理确认与取消。焦点圈定、进出场动画与遮罩样式均与 Dialog 一致，内容节点为 `role="alertdialog"` 语义。

::: tip 与 Dialog 的关系
AlertDialog 是 Dialog 的确认场景薄壳变体：收起触发器插槽与右上角关闭按钮，内置操作按钮与确认流程语义。需要自定义表单、复杂内容时请使用 `TDialog` + `#footer` 插槽。
:::

安装：

```bash
npx tu-design add alert-dialog
```

依赖说明：registry 项 `alert-dialog` 自动携带 `@ark-ui/vue` 运行时依赖、`button` 组件与 `cn` 工具。

## 基础用法

`v-model:open` 控制显隐，`title` / `description` 传文案，`@confirm` / `@cancel` 分别在用户点击「确认」「取消」后触发——两个按钮点击后都会自动关闭弹窗：

<DemoPreview file="alert-dialog/Basic.vue" />

## 危险操作（destructive）

设置 `destructive` 让确认按钮使用红色语义色，适合删除、清空等不可逆操作；取消按钮始终为 outline 次级样式：

<DemoPreview file="alert-dialog/Destructive.vue" />

## 异步确认

`@confirm` 处理器**返回 Promise** 时进入异步确认模式：

- 确认按钮立即进入 loading（禁用并显示转圈），文案切换为「处理中…」；
- **锁定所有关闭通道**——Escape、点击遮罩、取消按钮在 pending 期间全部无效；
- Promise resolve 后自动关闭；**reject 时弹窗保持打开**且退出 loading，用户可重试；
- 同步处理器（不返回 Promise）则点击后直接关闭。

<DemoPreview file="alert-dialog/AsyncConfirm.vue" />

## 无障碍

- 内容节点显式 `role="alertdialog"` + `aria-modal="true"`（覆盖 Ark Content 默认的 `role="dialog"`，补偿无上游 AlertDialog 原语的角色语义）；
- 复用 Ark Dialog 的 a11y 接线：`aria-labelledby` 指向标题、`aria-describedby` 指向描述，焦点圈定与还原内建；
- pending 期间锁定 Escape 与遮罩关闭，避免误触中断进行中的操作。

## API

### Props

| Prop          | 类型                   | 默认值   | 说明                                    |
| ------------- | ---------------------- | -------- | --------------------------------------- |
| `open`        | `boolean \| undefined` | —        | 受控开关（配合 `v-model:open`）         |
| `title`       | `string`               | 必填     | 标题文案（可被 `title` 插槽覆盖）       |
| `description` | `string`               | —        | 描述文案（可被 `description` 插槽覆盖） |
| `confirmText` | `string`               | `'确定'` | 确认按钮文案                            |
| `cancelText`  | `string`               | `'取消'` | 取消按钮文案                            |
| `destructive` | `boolean`              | `false`  | 确认按钮使用 destructive 语义色         |

### Events

| 事件      | 说明                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `confirm` | 点击确认按钮后触发；处理器返回 Promise 时进入异步确认模式（loading + 锁定关闭） |
| `cancel`  | 点击取消按钮后触发（pending 期间不可触发），随后自动关闭                        |

### Slots

| 插槽          | 说明               |
| ------------- | ------------------ |
| `title`       | 覆盖标题           |
| `description` | 覆盖描述           |
| `default`     | 标题与按钮间的正文 |

### v-model

| 绑定   | 类型                   | 说明                                    |
| ------ | ---------------------- | --------------------------------------- |
| `open` | `boolean \| undefined` | 显隐开关；状态变化经 `update:open` 回写 |

::: tip 受控语义
`open` prop 以 `default: undefined` 声明（禁用 Boolean casting）：只有显式传入 `open` 才进入受控模式，不传即走内部状态，与 `TDialog` 行为一致。
:::

## 主题定制

按钮样式由 Button 组件的 `default` / `destructive` / `outline` 变体驱动；面板、遮罩沿用 Dialog 的 token（`--background` / `--border` / `--muted-foreground` 等），暗色模式自动跟随主题变量，无需额外适配。
