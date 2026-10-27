---
title: Select 选择器
description: 下拉选择框：基于 Ark UI Select 原语，内置键盘导航、选中回显与勾选指示，Trigger 支持 asChild。
---

# Select

下拉选择框：基于 Ark UI Select 原语，内置键盘导航、选中回显与勾选指示。`TSelectTrigger` 支持 `asChild`。

安装：

```bash
npx tu-design add select
```

## 基础用法

`items` 声明选项（用于键盘导航与回显的 collection），面板内用 `TSelectItem` 逐项渲染：

<DemoPreview file="select/SelectDemo.vue" />

## 字符串与禁用项

`items` 也接受字符串数组（label 与 value 相同）；对象项可带 `disabled`：

<DemoPreview file="select/SelectStrings.vue" />

## 组件结构

| 组件               | 说明                                          |
| ------------------ | --------------------------------------------- |
| `TSelect`          | 根组件，`items` 构建 collection，管理值与开合 |
| `TSelectTrigger`   | 触发器（内置 chevron，支持 `asChild`）        |
| `TSelectValueText` | 选中回显（自含渲染，不接收插槽内容）          |
| `TSelectContent`   | 弹层面板容器                                  |
| `TSelectItem`      | 选项（文本取自 `item`，右侧勾选指示）         |

## API

### Props

#### TSelect

| Prop                             | 类型                                        | 默认值  | 说明                 |
| -------------------------------- | ------------------------------------------- | ------- | -------------------- |
| `items`                          | `(string \| { label, value, disabled? })[]` | 必填    | 选项列表             |
| `v-model`                        | `string`                                    | —       | 当前值；不传为非受控 |
| `default-value`                  | `string`                                    | —       | 非受控时的初始值     |
| `open` / `default-open`          | `boolean`                                   | —       | 弹层开合             |
| `lazy-mount` / `unmount-on-exit` | `boolean`                                   | `false` | 内容挂载策略         |

#### TSelectTrigger / TSelectItem

| Prop                  | 类型                         | 默认值  | 说明               |
| --------------------- | ---------------------------- | ------- | ------------------ |
| `as-child`（Trigger） | `boolean`                    | `false` | 以子元素为渲染目标 |
| `item`（Item）        | `string \| { label, value }` | 必填    | 对应选项           |
| `class`               | `string`                     | —       | 追加/覆盖样式      |

### Events

| 事件                | 载荷              | 说明       |
| ------------------- | ----------------- | ---------- |
| `update:modelValue` | `(value: string)` | 选中值变化 |
| `update:open`       | `(open: boolean)` | 弹层开合   |

### Slots

| 组件                               | 插槽      | 说明                                                 |
| ---------------------------------- | --------- | ---------------------------------------------------- |
| `TSelect`                          | `default` | 组装 `TSelectTrigger` 与 `TSelectContent`            |
| `TSelectTrigger`                   | `default` | 触发器内容（`asChild` 时不渲染内置 chevron）         |
| `TSelectContent`                   | `default` | 选项列表                                             |
| `TSelectItem` / `TSelectValueText` | —         | 无插槽：Item 文本取自 `item`，ValueText 自含选中回显 |

## 说明

- 单选语义：`v-model` 为 `string`（Ark 内部以数组表示，包装层已转换）
- `TSelectValueText` 自含选中回显，不要向其传插槽内容
- 键盘 `↑`/`↓` 高亮、`Enter` 选中、`Escape` 关闭

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
  <TSelect v-model="value" :items="items">
    <TSelectTrigger />
    <TSelectContent>
      <TSelectItem v-for="i in items" :key="i.value" :item="i" />
    </TSelectContent>
  </TSelect>
</div>
```
