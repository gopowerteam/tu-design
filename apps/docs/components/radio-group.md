---
title: RadioGroup 单选组
description: 单选组：基于 Ark UI Radio Group 原语，键盘 ↑/↓ 导航，支持 options 声明式渲染。
---

# RadioGroup

单选组：基于 Ark UI Radio Group 原语，键盘 `↑`/`↓` 导航。

安装：

```bash
npx tu-design add radio-group
```

## 基础用法

`v-model:value` 受控（或 `default-value` 非受控）；支持 `options` 声明式渲染（与默认插槽同传时插槽优先）、`orientation` 水平排列、`invalid` 校验态：

<DemoPreview file="radio-group/RadioGroupDemo.vue" />

## 组件结构

| 组件              | 说明                                  |
| ----------------- | ------------------------------------- |
| `TRadioGroup`     | 单选组根组件，管理选中值与键盘导航    |
| `TRadioGroupItem` | 单个选项（圆点控件 + 隐藏原生 input） |

## API

### Props

#### TRadioGroup

| Prop            | 类型                                        | 默认值       | 说明                                        |
| --------------- | ------------------------------------------- | ------------ | ------------------------------------------- |
| `v-model:value` | `string`                                    | —            | 当前值；不传为非受控（内部 ref 维护）       |
| `default-value` | `string`                                    | —            | 非受控时的初始值                            |
| `options`       | `(string \| { label, value, disabled? })[]` | —            | 声明式选项；与默认插槽同传时插槽优先        |
| `orientation`   | `'horizontal' \| 'vertical'`                | `'vertical'` | 排列方向                                    |
| `disabled`      | `boolean`                                   | `false`      | 整组禁用                                    |
| `name`          | `string`                                    | —            | 隐藏 input 的表单提交字段名                 |
| `form`          | `string`                                    | —            | 关联的 form id                              |
| `required`      | `boolean`                                   | `false`      | 必填（输出 `aria-required`/input required） |
| `read-only`     | `boolean`                                   | `false`      | 只读                                        |
| `invalid`       | `boolean`                                   | `false`      | 校验无效态（级联 `data-invalid`）           |

#### TRadioGroupItem

| Prop       | 类型      | 默认值  | 说明           |
| ---------- | --------- | ------- | -------------- |
| `value`    | `string`  | 必填    | 选中后写入组值 |
| `disabled` | `boolean` | `false` | 禁用该项       |

### Events

| 事件           | 载荷              | 说明       |
| -------------- | ----------------- | ---------- |
| `update:value` | `(value: string)` | 选中值变化 |

### Slots

| 组件              | 插槽      | 说明                                                |
| ----------------- | --------- | --------------------------------------------------- |
| `TRadioGroup`     | `default` | 自定义选项列表；未提供时回退到 `options` 声明式渲染 |
| `TRadioGroupItem` | `default` | 选项文本（Ark `ItemText`，自动关联可访问性）        |

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`；`name` 写入隐藏 input 供原生表单提交：

<DemoPreview file="radio-group/RadioGroupFormDemo.vue" />
