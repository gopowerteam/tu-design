---
title: Dialog 对话框
description: 模态对话框，内置焦点圈定、Escape / 遮罩点击关闭与进出场动画。
---

# Dialog

模态对话框：基于 Ark UI Dialog 原语封装，内置焦点圈定与还原、Escape / 遮罩点击关闭、滚动锁定与 `tw-animate-css` 进出场动画。`TDialogTrigger` / `TDialogClose` 支持 `asChild`，可把行为合并到任意元素或组件（如 `<TButton>`）上。

安装：

```bash
npx tu-design add dialog
```

依赖说明：registry 项 `dialog` 自动携带 `@ark-ui/vue` 运行时依赖与 `cn` 工具。

## 基础用法

基础三件套：`TDialog`（根，状态容器）+ `TDialogTrigger`（打开）+ `TDialogContent`（面板）。内容区用 `TDialogHeader` / `TDialogTitle` / `TDialogDescription` / `TDialogFooter` 组装，`TDialogClose` 包裹的元素点击即关闭（含内置右上角关闭按钮，`show-close-button` 可关闭）。

<DemoPreview file="dialog/DialogDemo.vue" />

## 受控用法

需要程序化控制开关时使用 `v-model:open`：外部按钮直接改写 `open` ref 即可打开对话框，Escape / 遮罩关闭也会同步回写。

<DemoPreview file="dialog/DialogControlled.vue" />

## 组件结构

| 组件                                  | 说明                               |
| ------------------------------------- | ---------------------------------- |
| `TDialog`                             | 根组件，状态容器（`v-model:open`） |
| `TDialogTrigger`                      | 触发打开，支持 `asChild`           |
| `TDialogContent`                      | 内容面板，内置右上角关闭按钮       |
| `TDialogHeader` / `TDialogFooter`     | 头部 / 底部布局容器                |
| `TDialogTitle` / `TDialogDescription` | 标题 / 描述，自动关联 aria 属性    |
| `TDialogClose`                        | 关闭触发器，支持 `asChild`         |

## API

### Props

#### TDialog

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:open`    | `boolean` | —       | 受控开关；不传为非受控 |
| `default-open`    | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount`      | `boolean` | `false` | 首次打开前不挂载内容   |
| `unmount-on-exit` | `boolean` | `false` | 关闭动画结束后卸载内容 |

#### TDialogContent

| Prop                | 类型      | 默认值 | 说明                              |
| ------------------- | --------- | ------ | --------------------------------- |
| `show-close-button` | `boolean` | `true` | 右上角内置关闭按钮                |
| `class`             | `string`  | —      | 追加/覆盖面板样式（经 `cn` 合并） |

#### TDialogTrigger / TDialogClose

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| `as-child` | `boolean` | `false` | 以子元素为渲染目标，行为合并其上 |

#### 其他子组件

`TDialogTitle` / `TDialogDescription` / `TDialogHeader` / `TDialogFooter` 均只接受 `class`（追加/覆盖样式，经 `cn` 合并）。

### Events

`TDialog` 仅发出 `update:open`（`v-model:open` 的配套事件），无其他自定义事件：

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 开关状态变化时触发 |

### Slots

全部子组件均只提供默认插槽，内容直接写在标签内，无命名插槽。

## 可访问性

- `TDialogTitle` 渲染为 `h2` 并自动关联 `aria-labelledby`；`TDialogDescription` 关联 `aria-describedby`
- 打开时焦点移入对话框并圈定，关闭后还原到触发元素
- `Escape` 与遮罩点击默认关闭（Root 层 `close-on-escape` / `close-on-interact-outside` 可调）
