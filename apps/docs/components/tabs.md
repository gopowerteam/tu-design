---
title: Tabs 标签页
description: 基于 Ark UI Tabs 的单组件选项卡，items 驱动，支持键盘导航与受控/非受控双模式。
---

# Tabs

单组件选项卡：基于 Ark UI Tabs 原语，通过 `items` 配置标签列表、`#panel` 插槽渲染面板内容，支持键盘导航与受控/非受控双模式。

安装：

```bash
npx @tu-design/cli add tabs
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

`activation-mode` 控制键盘导航行为，默认 `automatic`（聚焦即切换）；设为 `manual` 后 ←/→ 只移动焦点，需点击确认切换（浏览器中聚焦按钮的 Enter/Space 也会触发点击）：

<DemoPreview file="tabs/TabsActivation.vue" />

## 懒挂载

`lazy-mount` 让面板首次激活才挂载，`unmount-on-exit` 让面板切走即卸载。两者都支持两级配置：

- **组件级**：`lazy-mount` / `unmount-on-exit` 作为所有面板的默认值
- **item 级**：items 项的 `lazyMount` / `unmountOnExit` 优先级更高，逐面板生效

需要保留表单输入等状态的面板不要配置这两个字段：

<DemoPreview file="tabs/TabsLazy.vue" />

## 可关闭标签页

item 设置 `closable` 显示关闭按钮，点击发出 `close` 事件（载荷为该项 `value`），由使用方移除 items。非受控下关闭激活项会自动选中前一个邻居；受控时请同步回写 `value`。关闭按钮不触发选中（已阻断焦点与点击冒泡）。

`#prefix` / `#suffix` 插槽渲染标签栏两端内容（如「关闭全部」按钮）：

<DemoPreview file="tabs/TabsClosable.vue" />

## 切换拦截

`before-leave` 切换守卫：返回 `false` 或 resolve `false` 阻止切换，适用于表单未保存确认等场景。仅拦截用户交互切换；受控外部赋值与自动选邻居不经过守卫。异步守卫等待与拒绝期间 UI 保持旧态：

```ts
async function beforeLeave(next: string, prev: string) {
  return await confirm(`确定离开「${prev}」？`);
}
```

## 垂直方向

`orientation="vertical"` 切换为垂直布局，键盘导航自动变为 ↑/↓；`placement="right"` 可进一步让标签栏居右（布局由组件接管，勿向根元素传 flex 布局类）：

<DemoPreview file="tabs/TabsVertical.vue" />

## 款式

`type="line"` 切换为下划线款式，指示条自动跟随选中项动画移动（默认 `segment` 为分段块外观）。下划线指示条的位置在浏览器中自动计算，jsdom 场景下恒为 hidden：

<DemoPreview file="tabs/TabsLine.vue" />

## 位置

`placement` 控制标签栏位置：`bottom`（沉底）/ `right`（居右）通过布局反转实现，键盘导航语义随方向自动切换（bottom 仍 ←/→、right 为 ↑/↓）。布局由组件接管，**勿向根元素传 flex 布局类**：

<DemoPreview file="tabs/TabsPlacement.vue" />

## 自定义触发器

`#trigger` 插槽可自定义触发按钮内容（图标、徽标等），作用域参数为 `{ item }`，缺省渲染 `label`：

<DemoPreview file="tabs/TabsTriggerSlot.vue" />

## API

### Props

| Prop              | 类型                                          | 默认值           | 说明                              |
| ----------------- | --------------------------------------------- | ---------------- | --------------------------------- |
| `items`           | `TabItem[]`                                   | 必填             | 标签页配置列表                    |
| `v-model:value`   | `string`                                      | —                | 当前激活 tab；不传为非受控        |
| `default-value`   | `string`                                      | —                | 非受控时的初始 tab                |
| `activation-mode` | `'automatic' \| 'manual'`                     | `'automatic'`    | 聚焦即切换 / 需确认切换           |
| `lazy-mount`      | `boolean`                                     | `false`          | 组件级默认：面板首次激活才挂载    |
| `unmount-on-exit` | `boolean`                                     | `false`          | 组件级默认：面板切走即卸载        |
| `orientation`     | `'horizontal' \| 'vertical'`                  | `'horizontal'`   | 方向；vertical 时键盘导航变为 ↑/↓ |
| `loop-focus`      | `boolean`                                     | `true`（原生）   | 焦点是否首尾循环                  |
| `deselectable`    | `boolean`                                     | 关闭（原生默认） | 点击已选中项可取消选中            |
| `before-leave`    | `(next, prev) => boolean \| Promise<boolean>` | —                | 切换守卫，返回 false 阻止切换     |
| `type`            | `'segment' \| 'line'`                         | `'segment'`      | 款式：分段块 / 下划线             |
| `placement`       | `'top' \| 'left' \| 'right' \| 'bottom'`      | —                | 标签栏位置，布局由组件接管        |
| `animated`        | `boolean`                                     | `false`          | 面板激活时淡入过渡                |

注：`activation-mode` 组件未显式设默认，`'automatic'` 为 Ark 原语默认值；`orientation`/`loop-focus`/`deselectable` 为纯透传，不改变未传时的原生行为。

#### TabItem

| 字段            | 类型      | 说明                                   |
| --------------- | --------- | -------------------------------------- |
| `value`         | `string`  | 唯一标识，对应触发按钮与面板           |
| `label`         | `string`  | 触发按钮文案                           |
| `disabled`      | `boolean` | 禁用该标签（不参与键盘导航）           |
| `lazyMount`     | `boolean` | 面板首次激活才挂载（优先于组件级默认） |
| `unmountOnExit` | `boolean` | 面板切走即卸载（优先于组件级默认）     |
| `class`         | `string`  | 追加到触发按钮的样式类                 |
| `closable`      | `boolean` | 显示关闭按钮，点击发出 `close` 事件    |

### Events

| 事件           | 载荷                                                             | 说明                    |
| -------------- | ---------------------------------------------------------------- | ----------------------- |
| `update:value` | `(value: string)`；启用 `deselectable` 后取消选中时载荷为 `null` | 激活 tab 变化时触发     |
| `close`        | `(value: string)`                                                | item 关闭按钮点击时触发 |

### Slots

| 插槽       | 参数       | 说明                                                 |
| ---------- | ---------- | ---------------------------------------------------- |
| `#panel`   | `{ item }` | 渲染对应面板的内容                                   |
| `#trigger` | `{ item }` | 自定义触发按钮内容（图标、徽标等），缺省渲染 `label` |
| `#prefix`  | —          | 标签栏左侧内容                                       |
| `#suffix`  | —          | 标签栏右侧内容（如「关闭全部」按钮）                 |

## 说明

- 根元素上的 `class` 落在根容器（如 `w-96` 控制整体宽度），item 的 `class` 追加到触发按钮
- 面板与触发器统一使用 zag 语义的 `data-selected` 标记激活态（历史版本面板上的 `data-state` 已移除，此前依赖它定制面板样式的请改用 `data-selected`）
- 受控（传入 `value`）时严格跟随该值：父组件未回写前 UI 不会切换，仅发出 `update:value`
- 关闭按钮为 `role="button"` 的 span（避免 button 嵌套），键盘可达性有限；点击已阻断焦点转移与选中冒泡
- 非受控下激活项被移除时自动选中前一个邻居，全删光则无选中；受控时请自行同步 `value`
- `before-leave` 仅拦截用户交互切换；受控外部赋值与自动选邻居补偿不经过守卫
- `type="line"` 的下划线指示条位置在浏览器中自动计算，jsdom/SSR 无布局时恒 hidden
- `placement` 使用时布局由组件接管，勿向根元素传 `flex`/`flex-col` 等布局类（fallthrough 合并不经 tailwind-merge，存在覆盖冲突）
- `animated` 对 `unmountOnExit` 卸载型面板无过渡（挂载即卸载语义优先）
- `orientation="vertical"` 仅做最小样式适配，整体布局由 `placement` 或外层 class 控制
- 键盘 `←`/`→`（vertical 时 `↑`/`↓`）导航，`Home`/`End` 跳转首尾

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
