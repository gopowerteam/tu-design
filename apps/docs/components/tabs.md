---
title: Tabs 标签页
description: 基于 Ark UI Tabs 的单组件选项卡，items 驱动，支持键盘导航与受控/非受控双模式。
---

# Tabs

单组件选项卡：基于 Ark UI Tabs 原语，通过 `items` 配置标签列表、`#panel` 插槽渲染面板内容，支持键盘导航与受控/非受控双模式。

安装：

```bash
npx tu-design add tabs
```

## 基础用法

用 `items` 声明标签列表（`value` + `label`），面板内容写在 `#panel` 插槽中，通过 `slot prop` 的 `item` 区分当前渲染的面板；非受控时用 `default-value` 指定初始激活项：

```vue
<script setup lang="ts">
const items = [
  { value: "overview", label: "概览" },
  { value: "analytics", label: "分析" },
];
</script>

<template>
  <TTabs default-value="overview" :items="items">
    <template #panel="{ item }">
      <p class="pt-3 text-sm text-muted-foreground">{{ contents[item.value] }}</p>
    </template>
  </TTabs>
</template>
```

<DemoPreview file="tabs/TabsDemo.vue" />

## 受控用法

需要程序化控制激活项时使用 `v-model:value`，切换时同步回写：

<DemoPreview file="tabs/TabsControlled.vue" />

## 禁用项

在 items 项上设置 `disabled` 禁用单个标签：不可点击，键盘 ←/→ 导航也会自动跳过：

<DemoPreview file="tabs/TabsDisabled.vue" />

## 切换模式

`activation-mode` 控制键盘导航行为，默认 `automatic`（聚焦即切换）；设为 `manual` 后 ←/→ 只移动焦点，需 Enter 或点击确认切换：

<DemoPreview file="tabs/TabsActivation.vue" />

## 懒挂载

`lazy-mount` 让面板首次激活才挂载，`unmount-on-exit` 让面板切走即卸载。两者都支持两级配置：

- **组件级**：`lazy-mount` / `unmount-on-exit` 作为所有面板的默认值
- **item 级**：items 项的 `lazyMount` / `unmountOnExit` 优先级更高，逐面板生效

需要保留表单输入等状态的面板不要配置这两个字段：

<DemoPreview file="tabs/TabsLazy.vue" />

## API

### Props

| Prop              | 类型                      | 默认值        | 说明                           |
| ----------------- | ------------------------- | ------------- | ------------------------------ |
| `items`           | `TabItem[]`               | 必填          | 标签页配置列表                 |
| `v-model:value`   | `string`                  | —             | 当前激活 tab；不传为非受控     |
| `default-value`   | `string`                  | —             | 非受控时的初始 tab             |
| `activation-mode` | `'automatic' \| 'manual'` | `'automatic'` | 聚焦即切换 / 需确认切换        |
| `lazy-mount`      | `boolean`                 | `false`       | 组件级默认：面板首次激活才挂载 |
| `unmount-on-exit` | `boolean`                 | `false`       | 组件级默认：面板切走即卸载     |

注：`activation-mode` 组件未显式设默认，`'automatic'` 为 Ark 原语默认值。

#### TabItem

| 字段            | 类型      | 说明                                   |
| --------------- | --------- | -------------------------------------- |
| `value`         | `string`  | 唯一标识，对应触发按钮与面板           |
| `label`         | `string`  | 触发按钮文案                           |
| `disabled`      | `boolean` | 禁用该标签（不参与键盘导航）           |
| `lazyMount`     | `boolean` | 面板首次激活才挂载（优先于组件级默认） |
| `unmountOnExit` | `boolean` | 面板切走即卸载（优先于组件级默认）     |
| `class`         | `string`  | 追加到触发按钮的样式类                 |

### Events

| 事件           | 载荷              | 说明                |
| -------------- | ----------------- | ------------------- |
| `update:value` | `(value: string)` | 激活 tab 变化时触发 |

### Slots

| 插槽     | 参数       | 说明               |
| -------- | ---------- | ------------------ |
| `#panel` | `{ item }` | 渲染对应面板的内容 |

## 说明

- 根元素上的 `class` 落在根容器（如 `w-96` 控制整体宽度），item 的 `class` 追加到触发按钮
- 激活态样式挂在 `data-[selected]` 上（zag 语义），自定义主题时同理
- 键盘 `←`/`→` 导航，`Home`/`End` 跳转首尾

## 主题定制

Tabs 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                             | 用途                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `--muted` / `--muted-foreground` | 标签列表底色 / 文字                                        |
| `--background` / `--foreground`  | 激活标签底色 / 文字（`data-[selected]:bg-background` 等）  |
| `--ring`                         | 标签焦点环颜色（`focus-visible:ring-ring/50`）             |
| `--radius`                       | 圆角基准（列表 `rounded-lg` / 触发按钮 `rounded-md` 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--muted: oklch(0.95 0.02 260)">
  <TTabs default-value="a" :items="items">…</TTabs>
</div>
```
