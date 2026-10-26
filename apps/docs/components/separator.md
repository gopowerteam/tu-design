---
title: Separator 分隔线
description: 分隔线，支持水平与垂直方向。
---

# Separator

分隔线，支持水平与垂直方向。

安装：

```bash
npx tu-design add separator
```

## 基础用法

::: tip
垂直方向需要父容器有确定高度（组件自身 `h-full w-px`）。
:::

<DemoPreview file="separator/SeparatorDemo.vue" />

## API

### Props

| Prop          | 类型                         | 默认值         | 说明                                |
| ------------- | ---------------------------- | -------------- | ----------------------------------- |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向（`data-orientation` 同步输出） |
| `class`       | `string`                     | —              | 追加/覆盖样式（经 `cn` 合并）       |
