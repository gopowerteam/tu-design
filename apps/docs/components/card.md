---
title: Card 卡片
description: 卡片容器：单组件 API，title/description 头部 + 命名插槽（cover/action/footer/header），支持尺寸、视觉变体、分段分隔与可关闭。
---

# Card

卡片容器：单组件 API，`title`/`description` 头部 + 命名插槽（`#cover`/`#action`/`#footer`/`#header`），支持尺寸、视觉变体、分段分隔与可关闭。

安装：

```bash
npx tu-design add card
```

## 基础用法

`title` 与 `description` 渲染进头部，默认插槽即内容区，`#footer` 放置底部操作：

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

`segmented` 在分区之间显示分隔线（不含封面，并自动补偿分区顶部间距）；`#cover` 是贴边裁剪的顶部媒体区：

<DemoPreview file="card/CardSegmented.vue" />

## 可关闭

`closable` 在右上角渲染关闭按钮，点击触发 `close` 事件；显隐由使用者自行控制：

<DemoPreview file="card/CardClosable.vue" />

> **注意**：`closable` 的关闭按钮绝对定位于右上角（`right-3 top-3`），与 `#action` 同用时两者会在右上角重叠，请二选一使用。

## 头部操作

`#action` 渲染在头部右侧动作区，提供时头部自动切换为两栏 grid 布局：

<DemoPreview file="card/CardAction.vue" />

## 自定义头部

`#header` 是全自定义逃生口，提供时替代 `title`/`description` 的头部渲染，可自由排版任意头部结构（`#action` 仍可叠加使用）；`#title`/`#description` 则可单独覆盖对应文案：

<DemoPreview file="card/CardHeader.vue" />

## 渲染结构

Card 内部按「封面 → 头部 → 内容 → 底部」顺序渲染，各分区均带 `data-slot` 属性；`size` 与 `segmented` 通过 CSS 选择器作用于分区：

| 插槽 / Prop   | 渲染元素 | data-slot          | 说明                                                  |
| ------------- | -------- | ------------------ | ----------------------------------------------------- |
| `title`       | `h3`     | `card-title`       | 标题：`font-semibold leading-none tracking-tight`     |
| `description` | `p`      | `card-description` | 描述文字：`text-sm text-muted-foreground`             |
| `#action`     | `div`    | `card-action`      | 头部右侧操作区（需与头部同时存在）                    |
| `#cover`      | `div`    | `card-cover`       | 顶部媒体区，负 margin 贴边 + 圆角裁剪                 |
| 默认插槽      | `div`    | `card-content`     | 内容区 `p-6 pt-0`                                     |
| `#footer`     | `div`    | `card-footer`      | 底部 `flex items-center p-6 pt-0`                     |
| `#header`     | `div`    | `card-header`      | 头部容器 `grid ... p-6`；含 `#action` 时自动两栏 grid |

无任何头部内容（`title`/`description`/`#title`/`#description`/`#header`/`#action` 均为空）时不渲染 header DOM。

## API

### Props

| Prop          | 类型                        | 默认值      | 说明                                                    |
| ------------- | --------------------------- | ----------- | ------------------------------------------------------- |
| `title`       | `string`                    | —           | 标题文案，渲染进头部；`#title` / `#header` 插槽可覆盖   |
| `description` | `string`                    | —           | 描述文案，渲染进头部；`#description` / `#header` 可覆盖 |
| `size`        | `"sm" \| "default" \| "lg"` | `"default"` | 卡片尺寸，联动圆角、字级与分区 padding                  |
| `bordered`    | `boolean`                   | `true`      | 是否显示边框；关闭时同时移除阴影基底                    |
| `hoverable`   | `boolean`                   | `false`     | 悬浮时提升阴影                                          |
| `interactive` | `boolean`                   | `false`     | 可点击卡片：hover 提升 + `cursor-pointer` + 按压回落    |
| `embedded`    | `boolean`                   | `false`     | 嵌入式背景（`bg-muted/30`）                             |
| `segmented`   | `boolean`                   | `false`     | 分区之间显示分隔线（不含封面，并自动补偿分区顶部间距）  |
| `closable`    | `boolean`                   | `false`     | 右上角显示关闭按钮（内联 SVG，`aria-label="关闭"`）     |
| `class`       | `string`                    | —           | 追加/覆盖样式（经 `cn` 合并）                           |

### Events

| 事件    | 说明                                     |
| ------- | ---------------------------------------- |
| `close` | 点击关闭按钮时触发；显隐由使用者自行控制 |

### Slots

| 插槽           | 说明                                                      |
| -------------- | --------------------------------------------------------- |
| 默认插槽       | 内容区（原 CardContent 样式）                             |
| `#cover`       | 顶部媒体区（原 CardCover 样式）                           |
| `#action`      | 头部右侧动作区（原 CardAction 样式）                      |
| `#footer`      | 底部（原 CardFooter 样式）                                |
| `#title`       | 覆盖标题渲染（可放富文本），回退到 `title` prop           |
| `#description` | 覆盖描述渲染，回退到 `description` prop                   |
| `#header`      | 全自定义逃生口，提供时替代 `title`/`description` 头部渲染 |

## 主题定制

Card 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                           | 用途                                                                    |
| ------------------------------ | ----------------------------------------------------------------------- |
| `--card` / `--card-foreground` | 卡片底色 / 文字（`bg-card` / `text-card-foreground`）                   |
| `--border`                     | 边框色（`border-border`；`bordered: false` 时随边框一并移除）           |
| `--muted`                      | `embedded` 变体底色（`bg-muted/30`）；关闭按钮 hover 底色               |
| `--muted-foreground`           | 关闭按钮与描述文字颜色                                                  |
| `--ring`                       | 关闭按钮焦点环颜色                                                      |
| `--radius`                     | 圆角基准（`rounded-xl` 默认 / `rounded-lg` sm / `rounded-2xl` lg 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--card: oklch(0.97 0.02 260)">
  <TCard title="品牌色卡片">内容</TCard>
</div>
```
