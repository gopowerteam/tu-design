---
title: Label 标签
description: 表单标签，用于标注表单控件。
---

# Label

表单标签，用于标注表单控件并建立点击聚焦关联。

安装：

```bash
npx tu-design add label
```

## 基础用法

用 `for` 指向控件的 `id`，点击标签即可聚焦输入框：

<DemoPreview file="label/LabelDemo.vue" />

## 包裹控件

label 也可以作为包裹容器：插槽内直接放置控件时无需 `for`/`id`，点击文字同样聚焦控件。适合复选框行、纵向「标签 + 输入框」组合等场景：

<DemoPreview file="label/LabelWrap.vue" />

## 必填与禁用

必填标记通过在插槽内追加 `span` 实现；控件禁用时建议同步给标签加 `text-muted-foreground` 弱化强调：

<DemoPreview file="label/LabelStates.vue" />

## 组件结构

Label 为单组件，无子组件；不使用 cva，样式为固定工具类（`text-sm font-medium leading-none`）加 `class` 合并。

## API

### Props

| Prop    | 类型     | 默认值 | 说明                          |
| ------- | -------- | ------ | ----------------------------- |
| `class` | `string` | —      | 追加/覆盖样式（经 `cn` 合并） |

渲染 `<label>`（`text-sm font-medium leading-none`）；`for`/`@click` 等原生属性透传。

### Events

Label 不声明自定义事件，`for`、`click` 等原生属性与事件随 attrs 透传到根 `<label>` 元素。

### Slots

| 插槽      | 说明     |
| --------- | -------- |
| `default` | 标签文字 |

## 主题定制

Label 样式为固定工具类（`text-sm font-medium leading-none`），不依赖任何主题 CSS 变量；调整字号/字重经 `class` 覆盖即可。
