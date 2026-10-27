---
title: Tabs 标签页
description: 基于 Ark UI Tabs 的选项卡，支持键盘导航与受控/非受控双模式。
---

# Tabs

选项卡：基于 Ark UI Tabs 原语，支持键盘导航与受控/非受控双模式。

安装：

```bash
npx tu-design add tabs
```

## 基础用法

`TTabs`（根，状态容器）内放 `TTabsList`（标签列表）+ `TTabsTrigger`（单个标签）+ `TTabsContent`（对应面板），非受控时用 `default-value` 指定初始激活项。

<DemoPreview file="tabs/TabsDemo.vue" />

## 受控用法

需要程序化控制激活项时使用 `v-model:value`，切换时同步回写：

<DemoPreview file="tabs/TabsControlled.vue" />

## 禁用项

在 `TTabsTrigger` 上设置 `disabled` 禁用单个标签：不可点击，键盘 ←/→ 导航也会自动跳过：

<DemoPreview file="tabs/TabsDisabled.vue" />

## 切换模式

`activation-mode` 控制键盘导航行为，默认 `automatic`（聚焦即切换）；设为 `manual` 后 ←/→ 只移动焦点，需 Enter 或点击确认切换：

<DemoPreview file="tabs/TabsActivation.vue" />

## 懒挂载

`lazy-mount` 让面板首次激活才挂载，`unmount-on-exit` 让面板切走即卸载。需要保留表单输入等状态的面板不要加这两个属性：

<DemoPreview file="tabs/TabsLazy.vue" />

## 组件结构

| 组件           | 说明                                |
| -------------- | ----------------------------------- |
| `TTabs`        | 根组件，状态容器（`v-model:value`） |
| `TTabsList`    | 标签列表容器                        |
| `TTabsTrigger` | 单个标签按钮                        |
| `TTabsContent` | 标签对应的内容面板                  |

## API

### Props

#### TTabs

| Prop                             | 类型                      | 默认值        | 说明                       |
| -------------------------------- | ------------------------- | ------------- | -------------------------- |
| `v-model:value`                  | `string`                  | —             | 当前激活 tab；不传为非受控 |
| `default-value`                  | `string`                  | —             | 非受控时的初始 tab         |
| `activation-mode`                | `'automatic' \| 'manual'` | `'automatic'` | 聚焦即切换 / 需确认切换    |
| `lazy-mount` / `unmount-on-exit` | `boolean`                 | `false`       | 内容挂载策略               |

注：`activation-mode` 组件未显式设默认，`'automatic'` 为 Ark 原语默认值。

#### TTabsTrigger

| Prop       | 类型      | 默认值  | 说明          |
| ---------- | --------- | ------- | ------------- |
| `value`    | `string`  | 必填    | 对应面板的值  |
| `disabled` | `boolean` | `false` | 禁用该 tab    |
| `class`    | `string`  | —       | 追加/覆盖样式 |

#### TTabsContent

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `value` | `string` | 必填   | 对应面板的值  |
| `class` | `string` | —      | 追加/覆盖样式 |

#### TTabsList

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `class` | `string` | —      | 追加/覆盖样式 |

### Events

`TTabs` 仅发出 `update:value`（`v-model:value` 的配套事件），无其他自定义事件：

| 事件           | 载荷              | 说明                |
| -------------- | ----------------- | ------------------- |
| `update:value` | `(value: string)` | 激活 tab 变化时触发 |

### Slots

全部子组件均只提供默认插槽，内容直接写在标签内，无命名插槽。

## 说明

- 激活态样式挂在 `data-[selected]` 上（zag 语义），自定义主题时同理
- 键盘 `←`/`→` 导航，`Home`/`End` 跳转首尾

## 主题定制

Tabs 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                             | 用途                                                      |
| -------------------------------- | --------------------------------------------------------- |
| `--muted` / `--muted-foreground` | 标签列表底色 / 文字（`TTabsList`）                        |
| `--background` / `--foreground`  | 激活标签底色 / 文字（`data-[selected]:bg-background` 等） |
| `--ring`                         | 标签焦点环颜色（`focus-visible:ring-ring/50`）            |
| `--radius`                       | 圆角基准（List `rounded-lg` / Trigger `rounded-md` 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--muted: oklch(0.95 0.02 260)">
  <TTabs default-value="a">…</TTabs>
</div>
```
