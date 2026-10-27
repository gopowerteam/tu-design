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

`v-model:value` 受控（或 `default-value` 非受控）绑定当前选中项；选中即切换，回显文本随选择变化：

<DemoPreview file="radio-group/RadioGroupDemo.vue" />

::: tip 键盘导航
单选组天然支持键盘操作：聚焦后用 `↑`/`↓`（`orientation="horizontal"` 时为 `←`/`→`）在选项间移动并选中，`Space` 选中当前项。试一试：点击上面的选项后不要动鼠标，直接按方向键。
:::

## 声明式选项

传 `options` 即可整组渲染，不必手写 `TRadioGroupItem`；项支持 `disabled`。与默认插槽同传时插槽优先——简单列表用 `options` 更省事，需要自定义选项结构（描述、图标等）时用插槽：

<DemoPreview file="radio-group/RadioGroupOptionsDemo.vue" />

## 水平排列

`orientation="horizontal"` 让选项横向排布，键盘导航同步切换为 `←`/`→`：

<DemoPreview file="radio-group/RadioGroupHorizontalDemo.vue" />

## 状态

整组禁用（`disabled`）、单项禁用（item 上设 `disabled`）与 `invalid` 校验态对比：

<DemoPreview file="radio-group/RadioGroupStatesDemo.vue" />

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`；`name` 写入隐藏 input 供原生表单提交，`required` 配合校验器在提交时给出错误提示：

<DemoPreview file="radio-group/RadioGroupFormDemo.vue" />

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

## 主题定制

RadioGroup 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量            | 用途                                               |
| --------------- | -------------------------------------------------- |
| `--input`       | 圆点控件边框色                                     |
| `--primary`     | 选中圆点底色                                       |
| `--destructive` | `invalid` 态边框、光晕与圆点底色（`data-invalid`） |
| `--ring`        | 键盘聚焦环（`border-ring` / `ring-ring/50`）       |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TRadioGroup v-model:value="value" :options="options" />
</div>
```
