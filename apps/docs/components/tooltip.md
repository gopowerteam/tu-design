---
title: Tooltip 文字提示
description: 悬停或键盘聚焦触发的文字提示气泡，默认插槽即触发元素（asChild 语义）。
---

# Tooltip

文字提示气泡：悬停（或键盘聚焦）触发，基于 Ark UI Tooltip 原语。单组件 API：默认插槽内容**就是触发元素本身**，可挂在按钮、链接等任意元素上，不产生额外包裹元素。

安装：

```bash
npx tu-design add tooltip
```

## 基础用法

`content` 提供提示文字，默认插槽放触发元素，`delay-duration` 控制悬停延迟：

<DemoPreview file="tooltip/TooltipDemo.vue" />

## asChild 语义

默认插槽内容即触发元素本身：Tooltip 的触发行为（hover / focus 事件、`aria-describedby` 等）直接合并到该元素上，DOM 结构与不套 Tooltip 时一致。这意味着：

- 插槽内放 `<a>` 就是链接、放 `<TButton>` 就是按钮，样式与语义零污染；
- 可以与其它组件的触发元素自由组合。

若与 `TPopover` 等同为 asChild 的触发器双层嵌套出现「吞点击」，改用下方[受控用法](#受控用法)手动驱动 `open`（table-render 列设置同款方案）。

## 键盘触发

不依赖鼠标：用 Tab 把焦点移到触发元素上同样会打开气泡，Escape 关闭。

<DemoPreview file="tooltip/TooltipKeyboard.vue" />

## 弹出方向

通过 `positioning` 透传 Ark 原语调整位置，`placement` 支持四个方向（默认 `bottom`，空间不足时自动避让）：

<DemoPreview file="tooltip/TooltipPlacement.vue" />

## 触发延迟

`delay-duration` 控制悬停多久后显示，`0` 为立即显示；`close-duration` 控制移开后多久隐藏：

<DemoPreview file="tooltip/TooltipDelay.vue" />

## 富内容与透传

`#content` 插槽覆盖 `content` 文字渲染富内容；`content-class` 追加气泡样式，`content-props` 向气泡 Content 透传任意属性（`id`、`data-*`、事件监听等）：

<DemoPreview file="tooltip/TooltipRich.vue" />

## 受控用法

需要程序化控制显隐时使用 `v-model:open`，外部状态与气泡开关双向同步：

<DemoPreview file="tooltip/TooltipControlled.vue" />

省略默认插槽即为**纯受控气泡**——不渲染触发元素，`open` 直接驱动显隐，适合挂在自定义触发器上：

```vue
<TTooltip :open="tipOpen" content="列设置">
  <!-- 无默认插槽，气泡随 tipOpen 显隐 -->
</TTooltip>
```

渲染函数同构（受控 + 插槽均可用函数传入）：

```ts
h(
  Tooltip,
  { open: open.value },
  {
    default: () => [h("button", "悬停我")],
    content: () => "提示文字",
  },
);
```

## API

### Props

#### TTooltip

| Prop                             | 类型                  | 默认值  | 说明                                 |
| -------------------------------- | --------------------- | ------- | ------------------------------------ |
| `content`                        | `string`              | —       | 提示文字；`#content` 插槽可覆盖      |
| `v-model:open`                   | `boolean`             | —       | 受控开关；不传为非受控               |
| `default-open`                   | `boolean`             | `false` | 非受控时的初始状态                   |
| `delay-duration`                 | `number`              | `400`   | 悬停多久后显示（毫秒），`0` 立即显示 |
| `close-duration`                 | `number`              | `150`   | 移开后多久隐藏（毫秒）               |
| `lazy-mount` / `unmount-on-exit` | `boolean`             | `false` | 内容挂载策略                         |
| `content-class`                  | `string`              | —       | 追加/覆盖气泡样式（经 `cn` 合并）    |
| `content-props`                  | `Record<string, any>` | —       | 透传到气泡 Content 的属性对象        |

注：`delay-duration` / `close-duration` 组件未显式设默认，`400` / `150` 为 Ark 原语默认值。`open` 以 `default: undefined` 声明、禁用 Boolean casting，保证「未传」与 `false` 可辨（受控桥接约定）。

其余未声明的属性（如 `positioning`）透传给 Ark 原语 Root。

### Events

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 开关状态变化时触发 |

### Slots

| 插槽       | 说明                                         |
| ---------- | -------------------------------------------- |
| `default`  | 触发元素本身（asChild 语义，不额外包裹元素） |
| `#content` | 气泡内容，覆盖 `content` prop，可渲染富内容  |

## 说明

- 悬停打开依赖 `pointermove`（防止误扫过触发），键盘聚焦同样可触发；`Escape` 关闭
- 位置默认在下方自动避让，可通过 `positioning` 透传给 Ark 原语调整
- 进出场动画基于 `data-[state]` + `tw-animate-css`

## 主题定制

Tooltip 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                   | 用途                          |
| ---------------------- | ----------------------------- |
| `--primary`            | 气泡底色                      |
| `--primary-foreground` | 气泡文字色                    |
| `--radius`             | 圆角基准（`rounded-md` 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TTooltip content="作用域主题">
    <TButton variant="outline">悬停查看</TButton>
  </TTooltip>
</div>
```
