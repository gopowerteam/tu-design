---
title: RadioGroup 单选组
description: 单选组：基于 Ark UI Radio Group 原语的单组件 API，items 数据驱动渲染，键盘 ↑/↓ 导航，支持 #item 插槽自定义选项。
---

# RadioGroup

单选组：基于 Ark UI Radio Group 原语的单组件封装，`items` 数据驱动渲染，键盘 `↑`/`↓` 导航。

安装：

```bash
npx tu-design add radio-group
```

## 基础用法

`items` 声明选项（对象项 `{ label, value }`），`v-model:value` 受控（或 `default-value` 非受控）绑定当前选中项；圆点控件、隐藏 input 与文本由组件内部组装，选中即切换，回显文本随选择变化：

<DemoPreview file="radio-group/RadioGroupDemo.vue" />

::: tip 键盘导航
单选组天然支持键盘操作：聚焦后用 `↑`/`↓`（`orientation="horizontal"` 时为 `←`/`→`）在选项间移动并选中，`Space` 选中当前项。试一试：点击上面的选项后不要动鼠标，直接按方向键。
:::

## 数据驱动与禁用项

整组渲染只需传 `items`，不必手写子组件；项支持 `disabled`，禁用项不响应点击且不参与键盘导航：

<DemoPreview file="radio-group/RadioGroupItemsDemo.vue" />

## 自定义选项渲染

`#item` 插槽接管单个选项的渲染，作用域提供 `item`（原始项）与 `checked`（是否选中）；未提供时使用内置渲染（圆点控件 + label）。隐藏 input 始终保留，`name`/`required` 等表单语义不因自定义渲染丢失：

<DemoPreview file="radio-group/RadioGroupCustomItemDemo.vue" />

## 水平排列

`orientation="horizontal"` 让选项横向排布，键盘导航同步切换为 `←`/`→`：

<DemoPreview file="radio-group/RadioGroupHorizontalDemo.vue" />

## 状态

整组禁用（`disabled`）、单项禁用（items 项设 `disabled`）与 `invalid` 校验态对比：

<DemoPreview file="radio-group/RadioGroupStatesDemo.vue" />

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`；`name` 写入隐藏 input 供原生表单提交，`required` 配合校验器在提交时给出错误提示：

<DemoPreview file="radio-group/RadioGroupFormDemo.vue" />

## API

### Props

| Prop            | 类型                                    | 默认值       | 说明                                        |
| --------------- | --------------------------------------- | ------------ | ------------------------------------------- |
| `items`         | `{ label, value, disabled?, class? }[]` | 必填         | 选项列表                                    |
| `v-model:value` | `string`                                | —            | 当前值；不传为非受控（内部 ref 维护）       |
| `default-value` | `string`                                | —            | 非受控时的初始值                            |
| `orientation`   | `'horizontal' \| 'vertical'`            | `'vertical'` | 排列方向                                    |
| `disabled`      | `boolean`                               | `false`      | 整组禁用                                    |
| `name`          | `string`                                | —            | 隐藏 input 的表单提交字段名                 |
| `form`          | `string`                                | —            | 关联的 form id                              |
| `required`      | `boolean`                               | `false`      | 必填（输出 `aria-required`/input required） |
| `read-only`     | `boolean`                               | `false`      | 只读                                        |
| `invalid`       | `boolean`                               | `false`      | 校验无效态（级联 `data-invalid`）           |

`items` 项字段：`value` 唯一标识（必填）、`label` 文案（必填）、`disabled` 禁用该项、`class` 追加到该项根元素的样式类。

### Events

| 事件           | 载荷              | 说明       |
| -------------- | ----------------- | ---------- |
| `update:value` | `(value: string)` | 选中值变化 |

### Slots

| 插槽    | 作用域              | 说明                                         |
| ------- | ------------------- | -------------------------------------------- |
| `#item` | `{ item, checked }` | 自定义单项渲染；未提供时渲染圆点控件与 label |

## 说明

- 单组件 API：`items` 数据驱动渲染，不再暴露 `RadioGroupItem` 子组件
- 键盘 `↑`/`↓`（`horizontal` 时 `←`/`→`）在选项间移动并选中，`Space` 选中当前项
- `#item` 只接管圆点控件与文本的渲染，隐藏原生 input 始终随选项渲染

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
  <TRadioGroup v-model:value="value" :items="items" />
</div>
```
