---
title: Select 选择器
description: 下拉选择框：单组件 API，传入 items 数据驱动渲染，内置键盘导航、选中回显与勾选指示，支持 #item 插槽自定义选项。
---

# Select

下拉选择框：单组件封装 Ark UI Select 原语，`items` 数据驱动渲染，内置键盘导航、选中回显与勾选指示。

安装：

```bash
npx tu-design add select
```

## 基础用法

`items` 声明选项（对象项 `{ label, value }`），触发器回显、弹层与选项由组件内部组装：

<DemoPreview file="select/SelectDemo.vue" />

## 字符串与禁用项

`items` 也接受字符串数组（label 与 value 相同）；对象项可带 `disabled`：

<DemoPreview file="select/SelectStrings.vue" />

## 自定义选项渲染

`#item` 插槽接管单个选项的渲染，作用域提供 `item`（原始项）、`label`、`selected`；未提供时使用内置渲染（label + 右侧勾选指示）：

<DemoPreview file="select/SelectCustomItem.vue" />

## API

### Props

| Prop            | 类型                                        | 默认值     | 说明                       |
| --------------- | ------------------------------------------- | ---------- | -------------------------- |
| `items`         | `(string \| { label, value, disabled? })[]` | 必填       | 选项列表                   |
| `v-model`       | `string`                                    | —          | 当前值；不传为非受控       |
| `default-value` | `string`                                    | —          | 非受控时的初始值           |
| `open`          | `boolean`                                   | —          | 弹层开合受控；不传为非受控 |
| `default-open`  | `boolean`                                   | `false`    | 非受控时的初始开合         |
| `placeholder`   | `string`                                    | `"请选择"` | 未选中时触发器的占位文案   |
| `trigger-class` | `string`                                    | —          | 透传合并到触发器的 class   |
| `content-class` | `string`                                    | —          | 透传合并到弹层的 class     |

### Events

| 事件                | 载荷              | 说明       |
| ------------------- | ----------------- | ---------- |
| `update:modelValue` | `(value: string)` | 选中值变化 |
| `update:open`       | `(open: boolean)` | 弹层开合   |

### Slots

| 插槽    | 作用域                      | 说明                                          |
| ------- | --------------------------- | --------------------------------------------- |
| `#item` | `{ item, label, selected }` | 自定义选项渲染；未提供时渲染 label 与勾选指示 |

## 说明

- 单选语义：`v-model` 为 `string`（Ark 内部以数组表示，包装层已转换）
- 键盘 `↑`/`↓` 高亮、`Enter` 选中、`Escape` 关闭
- `#item` 插槽只影响面板内选项的展示，触发器回显始终取选项的 `label`

## 主题定制

Select 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| `--input`                            | Trigger 边框色                                       |
| `--muted-foreground`                 | 占位态文字（`data-[placeholder]`）                   |
| `--ring`                             | Trigger 键盘聚焦环（`border-ring` / `ring-ring/50`） |
| `--popover` / `--popover-foreground` | 面板底色/文字                                        |
| `--accent` / `--accent-foreground`   | 选项高亮态（`data-[highlighted]`）底色/文字          |
| `--radius`                           | 圆角基准（`rounded-md`/`rounded-sm` 派生）           |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--accent: oklch(0.9 0.06 260)">
  <TSelect v-model="value" :items="items" />
</div>
```
