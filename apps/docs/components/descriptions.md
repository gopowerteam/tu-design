---
title: Descriptions 描述列表
description: 描述列表：数据驱动 items 渲染标签/内容对，支持标签上下/左右布局、跨列 span、响应式列数、带边框表格样式与尺寸。
---

# Descriptions

描述列表：数据驱动 `items` 渲染「标签 / 内容」对，用于详情页、抽屉、卡片内的只读信息展示；支持标签上下 / 左右布局、跨列 `span`、响应式列数与带边框表格样式。

安装：

```bash
npx @tu-design/cli add descriptions
```

## 基础用法

传入 `items` 即可渲染，默认 `3` 列、标签在内容上方；`title` / `extra` 渲染进头部（`#title` / `#extra` 插槽可覆盖）：

<DemoPreview file="descriptions/DescriptionsDemo.vue" />

## 带边框

`bordered` 渲染为表格样式：外框圆角、`1px` 网格线、标签单元格浅底。顶部标签模式下，同一行各项的标签行与内容行**分别共享行高**——某个长标签换行时，整排标签一起变高，内容起始线仍然对齐：

<DemoPreview file="descriptions/DescriptionsBordered.vue" />

> **实现说明**：`bordered` + 顶部标签使用 CSS subgrid 对齐跨项行（Chrome 117+ / Safari 16+ / Firefox 71+）。不支持 subgrid 的浏览器自动退化为普通堆叠，内容与网格线均正常显示，仅失去跨项行对齐。

## 标签位置

`label-placement="left"` 把标签放到内容左侧，适合字段较多、标签较短的详情场景：

<DemoPreview file="descriptions/DescriptionsLabelPlacement.vue" />

- `label-align`：左置标签的对齐方式（`left` / `right` / `center`，默认 `left`），仅 `label-placement="left"` 生效。
- `label-width`：左置标签列宽，数字按 `px`，字符串为单条 CSS 轨道宽度（如 `"6rem"`）。缺省值：`bordered` + 左置为 `8rem`（固定宽度让各项的标签 / 内容分隔线对齐），其余场景为 `auto`。
- `separator`：左置标签后的分隔符，默认 `":"`；仅在 `label-placement="left"` 且**非** `bordered` 时渲染（带边框时标签是独立单元格，不再追加冒号），传空字符串关闭。

## 响应式列数

`column` 传断点对象时按视口宽度自适应，断点与 Tailwind 默认断点一致（`sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1536`），取「不超过视口宽度的最大断点」，全部未命中回落 `base`（缺省 `1`）：

<DemoPreview file="descriptions/DescriptionsResponsive.vue" />

> **注意**：
>
> - 断点基于**视口宽度**而非容器宽度，窄卡片内不会按容器自动减列；需要按容器收缩时请自行在外层按断点切换数字 `column`。
> - 断点对象模式下，服务端渲染与客户端首帧都按 `base` 档渲染、挂载后按真实视口校正，以保证水合一致。固定数字列数没有这个校正过程。

## 跨列

单项通过 `span` 跨多列。组件按列数做行打包，保证每行恰好填满（带边框时网格线不会出现空洞）：

- `span` 放不进当前行剩余列时，**夹到剩余列**并结束当前行；
- 最后一行不足时，**拉伸最后一项补满**整行；
- `span` 为非法值（`0` / 负数 / `NaN`）时按 `1` 处理，小数截断。

<DemoPreview file="descriptions/DescriptionsSpan.vue" />

> **注意**：发生夹紧意味着该行的 `span` 配置与列数不匹配，开发模式下组件会在控制台提示一次（每个实例仅一次），生产构建不提示。

## 尺寸

`size` 联动字号；`bordered` 时同时联动单元格与头部 `padding`：

<DemoPreview file="descriptions/DescriptionsSizes.vue" />

## 自定义内容

`#label` / `#content` 为作用域插槽，接收 `{ item, index }`，可渲染徽标、链接等富内容；未提供时回退到 `item.label` / `item.content`：

<DemoPreview file="descriptions/DescriptionsSlots.vue" />

## 渲染结构

Descriptions 渲染为语义化描述列表 `<dl data-slot="descriptions-body">`，每项为一个分组 `<div data-slot="descriptions-item">`，内部恒为 `<dt>` + `<dd>`（无标签的项也保留空 `dt`，保证分组结构与网格对齐）：

| 区域       | 元素   | data-slot                | 说明                                                           |
| ---------- | ------ | ------------------------ | -------------------------------------------------------------- |
| 根容器     | `div`  | `descriptions`           | `bordered` 时为 `rounded-lg border overflow-hidden` 外框       |
| 头部区域   | `div`  | `descriptions-header`    | `title` / `extra` 任一存在才渲染                               |
| 标题文字   | `h3`   | `descriptions-title`     | `font-semibold leading-none tracking-tight`，字号随 `size`     |
| 附加区域   | `div`  | `descriptions-extra`     | 右对齐（`ml-auto`），弱化色                                    |
| 主体网格   | `dl`   | `descriptions-body`      | `grid`，内联 `grid-template-columns: repeat(N, minmax(0,1fr))` |
| 单项分组   | `div`  | `descriptions-item`      | 内联 `grid-column: span N`（打包后的最终跨列数）               |
| 标签单元格 | `dt`   | `descriptions-label`     | 弱化色；`bordered` 时 `bg-muted`                               |
| 分隔符     | `span` | `descriptions-separator` | 仅左置 + 非 `bordered` + 有标签时渲染                          |
| 内容单元格 | `dd`   | `descriptions-content`   | 前景色；`bordered` 时 `bg-background`                          |

带边框时的线条来自 `<dl>` 的 `bg-border` 在 `1px` 间隙处透出：单项 `div` 自身保持透明，`<dt>` / `<dd>` 的底色覆盖各自单元格。

## API

### Props

| Prop             | 类型                            | 默认值      | 说明                                                          |
| ---------------- | ------------------------------- | ----------- | ------------------------------------------------------------- |
| `items`          | `DescriptionsItemData[]`        | —           | 数据源，按数组顺序自左而右、自上而下渲染                      |
| `title`          | `string`                        | —           | 头部标题；`#title` 插槽可覆盖                                 |
| `extra`          | `string`                        | —           | 头部右侧附加区文案；`#extra` 插槽可覆盖                       |
| `column`         | `number \| DescriptionsColumn`  | `3`         | 列数；传断点对象时按视口宽度自适应                            |
| `labelPlacement` | `"top" \| "left"`               | `"top"`     | 标签位置：内容上方 / 左侧                                     |
| `labelAlign`     | `"left" \| "right" \| "center"` | `"left"`    | 标签对齐，仅 `labelPlacement="left"` 生效                     |
| `labelWidth`     | `string \| number`              | 见说明      | 左置标签列宽；缺省 `bordered + left` 为 `8rem`，其余为 `auto` |
| `size`           | `"sm" \| "default" \| "lg"`     | `"default"` | 尺寸，联动字号；`bordered` 时联动单元格与头部 padding         |
| `bordered`       | `boolean`                       | `false`     | 表格线 + 标签浅底                                             |
| `separator`      | `string`                        | `":"`       | 左置标签后的分隔符（仅非 `bordered`），空字符串关闭           |
| `class`          | `string`                        | —           | 追加/覆盖样式（经 `cn` 合并）                                 |

### DescriptionsItemData

| 字段      | 类型               | 默认值 | 说明                                           |
| --------- | ------------------ | ------ | ---------------------------------------------- |
| `key`     | `string \| number` | —      | 稳定 key，缺省用数组下标                       |
| `label`   | `string`           | —      | 标签文本；未提供时仍渲染空 `dt` 占位           |
| `content` | `string \| number` | —      | 内容文本；富内容用 `#content` 插槽             |
| `span`    | `number`           | `1`    | 跨列数；非法值回落 1，超出当前行剩余列时被夹紧 |

### DescriptionsColumn

```ts
type DescriptionsColumn =
  | number
  | Partial<Record<"base" | "sm" | "md" | "lg" | "xl" | "2xl", number>>;
```

### Slots

| 插槽       | 参数                                            | 说明                                    |
| ---------- | ----------------------------------------------- | --------------------------------------- |
| `#title`   | —                                               | 覆盖标题渲染，回退到 `title` prop       |
| `#extra`   | —                                               | 覆盖头部右侧附加区，回退到 `extra` prop |
| `#label`   | `{ item: DescriptionsItemData; index: number }` | 覆盖标签渲染，回退到 `item.label`       |
| `#content` | `{ item: DescriptionsItemData; index: number }` | 覆盖内容渲染，回退到 `item.content`     |

## 主题定制

Descriptions 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                                          |
| -------------------- | --------------------------------------------- |
| `--border`           | 外框与网格线（`border-border` / `bg-border`） |
| `--muted`            | 带边框时标签单元格底色（`bg-muted`）          |
| `--muted-foreground` | 标签与附加区文字颜色                          |
| `--background`       | 带边框时内容单元格底色（`bg-background`）     |
| `--foreground`       | 内容文字颜色                                  |
| `--radius`           | 圆角基准（`rounded-lg`）                      |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--border: oklch(0.7 0.05 260)">
  <TDescriptions bordered :items="items" />
</div>
```
