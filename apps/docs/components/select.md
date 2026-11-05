---
title: Select 选择器
description: 下拉选择框：单组件 API，传入 items 数据驱动渲染，内置键盘导航、选中回显与勾选指示，支持 #item 插槽自定义选项。
---

# Select

下拉选择框：单组件封装 Ark UI Select 原语，`items` 数据驱动渲染，内置键盘导航、选中回显与勾选指示。

安装：

```bash
npx @tu-design/cli add select
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

## 图标定制

`#trigger-icon` 插槽替换触发器内置的下拉箭头（默认 ChevronRight 旋转 90°、`opacity-50`）：

<DemoPreview file="select/SelectTriggerIconSlot.vue" />

使用 Iconify 时可放 `<Icon icon="lucide:chevron-down" />`（@iconify/vue）或 `<span class="icon-[lucide--chevron-down] size-4 opacity-50" />`（@iconify/tailwind4）。选项勾选指示的定制由 [`#item`](#自定义选项渲染) 插槽整体接管。

## 宽度

触发器默认撑满父容器（`w-full`），与 Input、DatePicker、Cascader 等表单类控件在 [Form](/components/form) 的 `FormItem` 中自动对齐，不会出现组件长短不一；超长选中值与占位文案自动省略号截断。弹层与触发器同宽（`positioning.sameWidth` 默认开启，触发器较窄时弹层保底 `min-w-[8rem]`）。需要自定义宽度或恢复收缩包裹内容时，经 `trigger-class` 覆盖（`cn` 走 tailwind-merge，宽度类可覆盖默认）：

<DemoPreview file="select/SelectWidth.vue" />

## API

### Props

| Prop            | 类型                                        | 默认值     | 说明                                                                               |
| --------------- | ------------------------------------------- | ---------- | ---------------------------------------------------------------------------------- |
| `items`         | `(string \| { label, value, disabled? })[]` | 必填       | 选项列表                                                                           |
| `v-model`       | `string`                                    | —          | 当前值；不传为非受控                                                               |
| `default-value` | `string`                                    | —          | 非受控时的初始值                                                                   |
| `open`          | `boolean`                                   | —          | 弹层开合受控；不传为非受控                                                         |
| `default-open`  | `boolean`                                   | `false`    | 非受控时的初始开合                                                                 |
| `placeholder`   | `string`                                    | `"请选择"` | 未选中时触发器的占位文案                                                           |
| `trigger-class` | `string`                                    | —          | 透传合并到触发器的 class；宽度类（如 `w-64`、`w-fit`）可覆盖默认的撑满（`w-full`） |
| `content-class` | `string`                                    | —          | 透传合并到弹层的 class                                                             |

### Events

| 事件                | 载荷              | 说明       |
| ------------------- | ----------------- | ---------- |
| `update:modelValue` | `(value: string)` | 选中值变化 |
| `update:open`       | `(open: boolean)` | 弹层开合   |

### Slots

| 插槽            | 作用域                      | 说明                                          |
| --------------- | --------------------------- | --------------------------------------------- |
| `#item`         | `{ item, label, selected }` | 自定义选项渲染；未提供时渲染 label 与勾选指示 |
| `#trigger-icon` | —                           | 替换触发器内置下拉箭头                        |

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

::: tip 微前端环境
本组件为浮层组件，在 wujie 微前端 / Shadow DOM 沙箱下会自动适配传送目标与定位策略，详见[微前端与沙箱](/guide/micro-frontend)。
:::
