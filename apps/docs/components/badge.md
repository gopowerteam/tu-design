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

## API

### Props

| Prop      | 类型                                                     | 默认值      | 说明                          |
| --------- | -------------------------------------------------------- | ----------- | ----------------------------- |
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline'` | `'default'` | 视觉变体                      |
| `class`   | `string`                                                 | —           | 追加/覆盖样式（经 `cn` 合并） |

### Slots

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 徽标内容 |
