---
title: Badge 徽章
description: 轻量状态徽标，支持四种变体。
---

# Badge

轻量状态徽标，支持四种变体。

安装：

```bash
npx tu-design add badge
```

## 基础用法

<DemoPreview file="badge/BadgeDemo.vue" />

## 组件结构

Badge 为单组件，无子组件；变体类由 `badgeVariants`（cva）统一生成。

## API

### Props

| Prop      | 类型                                                     | 默认值      | 说明                          |
| --------- | -------------------------------------------------------- | ----------- | ----------------------------- |
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | 视觉变体                      |
| `class`   | `string`                                                 | —           | 追加/覆盖样式（经 `cn` 合并） |

### Events

Badge 不声明自定义事件，原生事件随 attrs 透传到根元素。

### Slots

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 徽标内容 |

## 主题定制

Badge 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                     | 用途                          |
| ---------------------------------------- | ----------------------------- |
| `--primary` / `--primary-foreground`     | `default` 变体底色/文字       |
| `--secondary` / `--secondary-foreground` | `secondary` 变体底色/文字     |
| `--destructive`                          | `destructive` 变体底色        |
| `--foreground`                           | `outline` 变体文字色          |
| `--input`                                | `outline` 变体边框色          |
| `--radius`                               | 圆角基准（`rounded-md` 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TBadge>新</TBadge>
</div>
```
