---
title: Checkbox 多选框
description: 复选框：基于 Ark UI Checkbox 原语，内置隐藏 input 与勾选图标，标签插槽点击同样可切换。
---

# Checkbox

复选框：基于 Ark UI Checkbox 原语，内置隐藏 input 与勾选图标，标签插槽点击同样可切换。

安装：

```bash
npx tu-design add checkbox
```

## 基础用法

<DemoPreview file="checkbox/CheckboxDemo.vue" />

## 受控用法

`v-model:checked` 双向绑定勾选状态；不传时为非受控（初始值用 `default-checked`）：

<DemoPreview file="checkbox/CheckboxControlled.vue" />

## 多选组

多个 Checkbox 组合时，各 `checked` 状态由父组件统一维护（数组过滤即可增删选中项），适合技能标签、批量筛选等场景：

<DemoPreview file="checkbox/CheckboxGroupDemo.vue" />

## 全选与半选

`checked` 除布尔值外还接受 `"indeterminate"`，渲染短横线半选态，用于表格全选等「部分选中」语义。点击半选态父项会取消全选（回到全不选）：

<DemoPreview file="checkbox/CheckboxIndeterminateDemo.vue" />

## 禁用

<DemoPreview file="checkbox/CheckboxDisabled.vue" />

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`，`checked` 状态变化时同步到表单字段，配合校验器在提交时给出「必须勾选」的错误提示：

<DemoPreview file="checkbox/CheckboxFormDemo.vue" />

## 组件结构

Checkbox 为单组件，无子组件；勾选/半选态样式由 `data-[state]` 属性选择器驱动，无 cva 变体。

## API

### Props

| Prop              | 类型                         | 默认值  | 说明                                                |
| ----------------- | ---------------------------- | ------- | --------------------------------------------------- |
| `v-model:checked` | `boolean \| "indeterminate"` | —       | 选中状态，支持 `"indeterminate"` 半选；不传为非受控 |
| `default-checked` | `boolean`                    | `false` | 非受控时的初始状态                                  |
| `disabled`        | `boolean`                    | `false` | 禁用                                                |
| `class`           | `string`                     | —       | 追加/覆盖根样式                                     |

### Events

| 事件             | 载荷                 | 说明       |
| ---------------- | -------------------- | ---------- |
| `update:checked` | `(checked: boolean)` | 勾选态变化 |

### Slots

| 插槽      | 说明                                       |
| --------- | ------------------------------------------ |
| `default` | 标签文字，渲染在勾选框右侧，点击同样可切换 |

## 主题定制

Checkbox 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                   | 用途                                         |
| ---------------------- | -------------------------------------------- |
| `--input`              | 未选态边框色                                 |
| `--primary`            | 选中态底色与边框色（`data-[state=checked]`） |
| `--primary-foreground` | 选中态对勾/短横线颜色                        |
| `--ring`               | 键盘聚焦环（`border-ring` / `ring-ring/50`） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TCheckbox v-model:checked="agreed">同意条款</TCheckbox>
</div>
```
