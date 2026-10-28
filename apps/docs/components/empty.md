---
title: Empty 空状态
description: 空状态占位，含默认插画与描述文案。
---

# Empty

空状态占位，用于列表、搜索结果等为空时的展示。

安装：

```bash
npx tu-design add empty
```

## 基础用法

<DemoPreview file="empty/EmptyDemo.vue" />

## 自定义图标

用 `icon` 插槽替换内置插画，配合 `description` 自定义文案：

<DemoPreview file="empty/EmptyCustomIconDemo.vue" />

## 带操作

`default` 插槽渲染在文案下方的操作区，放置主行动按钮：

<DemoPreview file="empty/EmptyWithActionsDemo.vue" />

## 组件结构

Empty 为单组件、无 Ark 原语、纯展示。容器为居中 flex 列布局（`flex flex-col items-center justify-center gap-3 px-6 py-16`），内置插画为内联 SVG，走 `text-muted-foreground/60` 令牌色。

## API

### Props

| Prop          | 类型     | 默认值     | 说明             |
| ------------- | -------- | ---------- | ---------------- |
| `description` | `string` | `暂无数据` | 描述文案         |
| `class`       | `string` | —          | 追加到容器根元素 |

### Events

Empty 不声明自定义事件，原生事件随 attrs 透传到根元素。

### Slots

| Slot      | 说明                               |
| --------- | ---------------------------------- |
| `icon`    | 覆盖默认空盒插画（默认内联 SVG）   |
| `default` | 底部自定义内容区，通常放置操作按钮 |

## 无障碍

容器带 `role="status"`，内置插画 SVG 已标记 `aria-hidden="true"`，对屏幕阅读器隐藏装饰性图形。

## 主题定制

Empty 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途           |
| -------------------- | -------------- |
| `--muted-foreground` | 文案与插画颜色 |

暗色模式下随主题令牌自动适配，无需额外处理。
