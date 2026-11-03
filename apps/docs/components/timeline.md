---
title: Timeline 时间轴
description: 时间轴：数据驱动 items 渲染竖向事件流，支持单列/左右交替布局、五种语义节点色与空心节点、#item 作用域插槽自定义内容。
---

# Timeline

时间轴：数据驱动 `items` 渲染竖向事件流，支持单列/左右交替布局、五种语义节点色与空心节点，`#item` 作用域插槽可整项自定义内容。

安装：

```bash
npx @tu-design/cli add timeline
```

## 基础用法

传入 `items` 数组即可渲染单列时间轴，节点默认靠左，`timestamp`/`title`/`content` 按序渲染：

<DemoPreview file="timeline/TimelineDemo.vue" />

## 左右交替

`mode="alternate"` 让内容沿中轴线左右交替排布，适合审批流、操作日志等对成场景；`dotColor` 用语义 token 标记节点状态：

<DemoPreview file="timeline/TimelineAlternateDemo.vue" />

## 自定义节点与内容

`hollow` 渲染空心节点（描边 + 背景填充，颜色跟随 `dotColor`）；`#item` 作用域插槽接收 `{ item, index }` 整项接管内容渲染，节点与连线不受影响：

<DemoPreview file="timeline/TimelineCustomDemo.vue" />

## API

### Props

| Prop    | 类型                     | 默认值      | 说明                                   |
| ------- | ------------------------ | ----------- | -------------------------------------- |
| `items` | `TimelineItemData[]`     | —           | 数据源，按数组顺序自上而下渲染         |
| `mode`  | `"right" \| "alternate"` | `"right"`   | 布局模式：单列（节点靠左）/ 左右交替   |
| `size`  | `"sm" \| "default"`      | `"default"` | 尺寸，联动节点大小、连线位置与字号间距 |
| `class` | `string`                 | —           | 追加/覆盖样式（经 `cn` 合并）          |

### TimelineItemData

| 字段                 | 类型                                                              | 默认值      | 说明                             |
| -------------------- | ----------------------------------------------------------------- | ----------- | -------------------------------- |
| `title`              | `string`                                                          | —           | 事件标题                         |
| `content`            | `string`                                                          | —           | 事件描述文本                     |
| `timestamp`          | `string`                                                          | —           | 时间戳文案（纯展示，不解析日期） |
| `timestampPlacement` | `"top" \| "bottom"`                                               | `"top"`     | 时间戳位于内容上方或下方         |
| `dotColor`           | `"primary" \| "success" \| "warning" \| "destructive" \| "muted"` | `"primary"` | 节点颜色（语义 token）           |
| `hollow`             | `boolean`                                                         | `false`     | 空心节点（描边 + 背景填充）      |

### Slots

| 插槽    | 参数                                        | 说明                                                                        |
| ------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `#item` | `{ item: TimelineItemData; index: number }` | 整项内容覆盖，回退到默认的 timestamp/title/content 渲染；节点与连线不受影响 |

## 渲染结构

Timeline 渲染为语义列表：`<ol data-slot="timeline">` 内每项为 `<li data-slot="timeline-item">`，li 内依次是连线（`timeline-line`，纯装饰 `aria-hidden`）、节点（`timeline-dot`）与内容区（`timeline-content`）。首末项的连线裁切在模板内按 index 计算（不依赖 `first:`/`last:` 伪类），时间戳置底仅切换 `order-last`，不分支 DOM。
