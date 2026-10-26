---
title: Label 标签
description: 表单标签，用于标注表单控件。
---

# Label

表单标签。

安装：

```bash
npx tu-design add label
```

## 基础用法

用 `for` 指向控件的 `id`，点击标签即可聚焦输入框：

<DemoPreview file="label/LabelDemo.vue" />

## API

### Props

| Prop    | 类型     | 默认值 | 说明                          |
| ------- | -------- | ------ | ----------------------------- |
| `class` | `string` | —      | 追加/覆盖样式（经 `cn` 合并） |

渲染 `<label>`（`text-sm font-medium leading-none`）；`for`/`@click` 等原生属性透传。

### Slots

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 标签文字 |
