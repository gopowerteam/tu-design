---
title: Tooltip 文字提示
description: 悬停或键盘聚焦触发的文字提示气泡，Trigger 支持 asChild。
---

# Tooltip

文字提示气泡：悬停（或键盘聚焦）触发，基于 Ark UI Tooltip 原语。`TTooltipTrigger` 支持 `asChild`，可挂在按钮、链接等任意元素上。

安装：

```bash
npx tu-design add tooltip
```

## 基础用法

`TTooltip`（根，状态容器）+ `TTooltipTrigger`（触发元素）+ `TTooltipContent`（气泡内容），`delay-duration` 控制悬停延迟。

<DemoPreview file="tooltip/TooltipDemo.vue" />

## 键盘触发

不依赖鼠标：用 Tab 把焦点移到触发元素上同样会打开气泡，Escape 关闭。

<DemoPreview file="tooltip/TooltipKeyboard.vue" />

## 组件结构

| 组件              | 说明                               |
| ----------------- | ---------------------------------- |
| `TTooltip`        | 根组件，状态容器（`v-model:open`） |
| `TTooltipTrigger` | 触发元素，支持 `asChild`           |
| `TTooltipContent` | 气泡内容                           |

## API

### Props

#### TTooltip

| Prop                             | 类型      | 默认值  | 说明                                 |
| -------------------------------- | --------- | ------- | ------------------------------------ |
| `v-model:open`                   | `boolean` | —       | 受控开关；不传为非受控               |
| `default-open`                   | `boolean` | `false` | 非受控时的初始状态                   |
| `delay-duration`                 | `number`  | `400`   | 悬停多久后显示（毫秒），`0` 立即显示 |
| `close-duration`                 | `number`  | `150`   | 移开后多久隐藏（毫秒）               |
| `lazy-mount` / `unmount-on-exit` | `boolean` | `false` | 内容挂载策略                         |

注：`delay-duration` / `close-duration` 组件未显式设默认，`400` / `150` 为 Ark 原语默认值。

#### TTooltipTrigger

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| `as-child` | `boolean` | `false` | 以子元素为渲染目标，行为合并其上 |

#### TTooltipContent

| Prop    | 类型     | 默认值 | 说明                              |
| ------- | -------- | ------ | --------------------------------- |
| `class` | `string` | —      | 追加/覆盖气泡样式（经 `cn` 合并） |

### Events

`TTooltip` 仅发出 `update:open`（`v-model:open` 的配套事件），无其他自定义事件：

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 开关状态变化时触发 |

### Slots

全部子组件均只提供默认插槽，内容直接写在标签内，无命名插槽。

## 说明

- 悬停打开依赖 `pointermove`（防止误扫过触发），键盘聚焦同样可触发；`Escape` 关闭
- 位置默认在下方自动避让，可通过 `positioning` 透传给 Ark 原语调整
- 进出场动画基于 `data-[state]` + `tw-animate-css`
