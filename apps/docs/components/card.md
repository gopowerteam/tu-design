---
title: Card 卡片
description: 卡片容器族：Header/Title/Description/Content/Footer/Action/Cover，支持尺寸、视觉变体、分段分隔与可关闭。
---

# Card

卡片容器族：Header/Title/Description/Content/Footer/Action/Cover，支持尺寸、视觉变体、分段分隔与可关闭。

安装：

```bash
npx tu-design add card
```

## 基础用法

<DemoPreview file="card/CardDemo.vue" />

## 尺寸

`size` 联动圆角、字级与分区 padding，提供 `sm` / `default` / `lg` 三档：

<DemoPreview file="card/CardSizes.vue" />

## 视觉变体

`bordered` 控制边框与阴影基底，`embedded` 提供弱化的嵌入背景：

<DemoPreview file="card/CardVariants.vue" />

## 交互

`hoverable` 仅提升悬浮阴影；`interactive` 面向整卡可点击的场景（悬浮提升 + 上浮位移 + 按压回落）。整卡可点击时建议在 `Card` 上补 `role="button"` 与键盘事件，保证可达性：

<DemoPreview file="card/CardInteractive.vue" />

## 分段与媒体

`segmented` 在分区之间显示分隔线（不含 Cover，并自动补偿分区顶部间距）；`CardCover` 是贴边裁剪的顶部媒体区：

<DemoPreview file="card/CardSegmented.vue" />

## 可关闭

`closable` 在右上角渲染关闭按钮，点击触发 `close` 事件；显隐由使用者自行控制：

<DemoPreview file="card/CardClosable.vue" />

> **注意**：`closable` 的关闭按钮绝对定位于右上角（`right-3 top-3`），与 `CardAction` 同用时两者会在右上角重叠，请二选一使用。

## 头部操作

<DemoPreview file="card/CardAction.vue" />

## 组件结构

| 组件              | 渲染元素 | 说明                                                                     |
| ----------------- | -------- | ------------------------------------------------------------------------ |
| `Card`            | `div`    | 容器，`data-slot="card"`，经 `cardVariants` 提供尺寸与视觉变体，默认插槽 |
| `CardHeader`      | `div`    | 头部，`data-slot="card-header"`；含 `CardAction` 时自动切换为两栏 grid   |
| `CardTitle`       | `h3`     | 标题：`font-semibold leading-none tracking-tight`，默认插槽              |
| `CardDescription` | `p`      | 描述文字，默认插槽                                                       |
| `CardAction`      | `div`    | 头部右侧操作区（需置于 `CardHeader` 内），默认插槽                       |
| `CardCover`       | `div`    | 顶部媒体区，负 margin 贴边 + 圆角裁剪，默认插槽                          |
| `CardContent`     | `div`    | 内容区 `p-6 pt-0`，默认插槽                                              |
| `CardFooter`      | `div`    | 底部 `flex items-center p-6 pt-0`，默认插槽                              |

所有分区均带 `data-slot` 属性；`Card` 的 `size` 与 `segmented` 通过 CSS 选择器作用于分区。

## API

### Card Props

| Prop          | 类型                        | 默认值      | 说明                                                     |
| ------------- | --------------------------- | ----------- | -------------------------------------------------------- |
| `size`        | `"sm" \| "default" \| "lg"` | `"default"` | 卡片尺寸，联动圆角、字级与分区 padding                   |
| `bordered`    | `boolean`                   | `true`      | 是否显示边框；关闭时同时移除阴影基底                     |
| `hoverable`   | `boolean`                   | `false`     | 悬浮时提升阴影                                           |
| `interactive` | `boolean`                   | `false`     | 可点击卡片：hover 提升 + `cursor-pointer` + 按压回落     |
| `embedded`    | `boolean`                   | `false`     | 嵌入式背景（`bg-muted/30`）                              |
| `segmented`   | `boolean`                   | `false`     | 分区之间显示分隔线（不含 Cover，并自动补偿分区顶部间距） |
| `closable`    | `boolean`                   | `false`     | 右上角显示关闭按钮（内联 SVG，`aria-label="关闭"`）      |
| `class`       | `string`                    | —           | 追加/覆盖样式（经 `cn` 合并）                            |

### Events

| 事件    | 说明                                     |
| ------- | ---------------------------------------- |
| `close` | 点击关闭按钮时触发；显隐由使用者自行控制 |

### 子组件 Props

其余子组件均仅接受 `class`。

### Slots

全部组件均只提供默认插槽。

## 主题定制

Card 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                           | 用途                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| `--card` / `--card-foreground` | 卡片底色 / 文字（`bg-card` / `text-card-foreground`）                   |
| `--border`                     | 边框色（`border-border`；`bordered: false` 时随边框一并移除）           |
| `--muted`                      | `embedded` 变体底色（`bg-muted/30`）；关闭按钮 hover 底色               |
| `--muted-foreground`           | 关闭按钮图标色                                                          |
| `--ring`                       | 关闭按钮焦点环颜色                                                      |
| `--radius`                     | 圆角基准（`rounded-xl` 默认 / `rounded-lg` sm / `rounded-2xl` lg 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--card: oklch(0.97 0.02 260)">
  <TCard>品牌色卡片</TCard>
</div>
```
