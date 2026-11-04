---
title: Popover 气泡
description: 气泡弹层单组件，支持 click/hover/focus/manual 触发与 12 方位定位，受控/非受控开关，默认插槽即触发元素。
---

# Popover

气泡弹层：基于 Ark UI Popover 原语的**单组件**——默认插槽是触发元素本体（asChild 语义，不额外包裹元素），面板内容放 `#content` 插槽，内部自动收编 Trigger/Positioner/Content。

安装：

```bash
npx @tu-design/cli add popover
```

## 基础用法

默认插槽直接放触发元素（按钮、图标按钮等），面板内容放 `#content` 插槽。面板默认宽度 `w-72`，可通过 `content-class` 覆盖：

<DemoPreview file="popover/PopoverDemo.vue" />

## 受控用法

需要程序化控制展开状态时使用 `v-model:open`，外部状态与气泡开关双向同步：

<DemoPreview file="popover/PopoverControlled.vue" />

::: tip 受控语义
`open` prop 以 `default: undefined` 声明（禁用 Boolean casting）：**只有显式传入** `open` 才进入受控模式，不传即走内部非受控。受控时状态变化经 `update:open` 回写，未回写前视图不切换——适合在父组件中先行校验再决定开合的场景。
:::

## 对齐方式

通过 `align` 控制面板相对触发器的横轴对齐（`"start" | "center" | "end"`，默认 `"center"`），配合 `side` 控制主轴方向（`"top" | "bottom" | "left" | "right"`，默认 `"bottom"`），两者组合出 12 方位 `placement`。若经 attrs 透传的 `positioning` 中**显式给出 `placement`，其优先级高于 `side`/`align`**：

<DemoPreview file="popover/PopoverAlign.vue" />

## 弹出方向

`side` × `align` 组合定位；空间不足时由 Ark 定位引擎自动翻转（flip）避让：

<DemoPreview file="popover/PopoverSideAlign.vue" />

::: tip 完全自定义定位
仍可经 attrs 透传 Ark 原语的 `positioning`（`gutter`/`offset`/`flip` 等），其中**显式 `placement` 优先级高于 `side`/`align`**：

<DemoPreview file="popover/PopoverPlacement.vue" />
:::

## 触发方式

`trigger` 支持四种模式（默认 `"click"`）：

- `click`：点击切换（Ark 内建行为，完整 aria 自动接线）；
- `hover` / `focus`：经 `open-delay` / `close-delay`（默认各 100ms）延迟桥接，悬浮/聚焦面板保持打开（`keep-alive-on-hover`）；
- `manual`：纯受控，不响应任何触发事件，完全由 `v-model:open` 驱动。

`disabled` 使任何触发事件失效：

<DemoPreview file="popover/PopoverTrigger.vue" />

::: tip hover/focus 的实现说明
hover/focus/manual 模式下面板锚点使用 Ark 的 `Anchor`（无内建 click，行为不与切换冲突），并在触发元素上手动接线 `aria-haspopup` / `aria-expanded` / `aria-controls`。panel 打开后焦点移入面板会保持打开（焦点陷阱语义），离开面板后按 `close-delay` 关闭。
:::

## 箭头

`arrow` 显示指向触发元素的箭头（shadcn 风格默认无箭头），`arrow-class` 可覆盖箭头样式：

<DemoPreview file="popover/PopoverArrow.vue" />

## 内容定制

`#content` 插槽内可放任意内容，例如表单——提交后经 `v-model:open` 关闭气泡：

<DemoPreview file="popover/PopoverForm.vue" />

## 插槽定制

`#header` / `#footer` 具名插槽渲染在内容区上下（不带额外样式容器）；`match-trigger-width` 使面板宽度与触发元素一致（建议配 `content-class="w-auto"`）：

<DemoPreview file="popover/PopoverSlots.vue" />

## API

### Props

| Prop                  | 类型                                        | 默认值     | 说明                                                                                                  |
| --------------------- | ------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `v-model:open`        | `boolean`                                   | —          | 展开状态；不传为非受控                                                                                |
| `default-open`        | `boolean`                                   | `false`    | 非受控时的初始状态                                                                                    |
| `lazy-mount`          | `boolean`                                   | `false`    | 首次展开才挂载面板内容                                                                                |
| `unmount-on-exit`     | `boolean`                                   | `false`    | 收起时卸载面板内容                                                                                    |
| `trigger`             | `"click" \| "hover" \| "focus" \| "manual"` | `"click"`  | 触发方式：click 内建切换；hover/focus 延迟桥接；manual 纯受控                                         |
| `open-delay`          | `number`                                    | `100`      | hover/focus 打开延迟（毫秒）                                                                          |
| `close-delay`         | `number`                                    | `100`      | hover/focus 关闭延迟（毫秒）                                                                          |
| `keep-alive-on-hover` | `boolean`                                   | `true`     | hover/focus 时悬浮/聚焦面板保持打开                                                                   |
| `side`                | `"top" \| "bottom" \| "left" \| "right"`    | `"bottom"` | 面板主轴方向；`positioning.placement` 显式给出时以其为准                                              |
| `align`               | `"start" \| "center" \| "end"`              | `"center"` | 面板横轴对齐（与 `side` 组合成 12 方位）                                                              |
| `arrow`               | `boolean`                                   | `false`    | 显示指向触发元素的箭头                                                                                |
| `arrow-class`         | `string`                                    | —          | 追加/覆盖箭头样式类                                                                                   |
| `disabled`            | `boolean`                                   | `false`    | 禁用触发（不响应任何触发事件；已打开状态不受影响）                                                    |
| `portal`              | `boolean`                                   | `true`     | 面板 Teleport（默认 `body`）；`false` 时留在原地（不受嵌套裁剪影响）                                  |
| `to`                  | `string \| HTMLElement`                     | —          | Teleport 目标（选择器/元素），仅 `portal=true` 时生效；缺省时在 shadow DOM 沙箱自动降级为应用挂载容器 |
| `match-trigger-width` | `boolean`                                   | `false`    | 面板宽度与触发元素一致（建议配 `content-class="w-auto"`）                                             |
| `z-index`             | `number`                                    | —          | 覆盖面板/定位层级（默认走 zag 的 `--z-index` 层级体系）                                               |
| `content-class`       | `string`                                    | —          | 追加/覆盖面板样式类（如 `"w-56 p-0"`）                                                                |
| `content-props`       | `Record<string, unknown>`                   | —          | 透传到面板根元素的属性（`id`/`style`/`data-*` 等）                                                    |

其余 attrs（如 `positioning`、`modal`、`ids`）原样透传给 Ark Popover Root；`portal` 经真实 `<Teleport>` 实现（Ark Vue 原语不自带传送），目标由 `to` 指定或自动解析。

### 微前端 / Shadow DOM

在 wujie 等 shadow DOM 沙箱微前端中，默认 Teleport 到 `body` 会把面板传送出 shadow root——Tailwind 样式与 `--popover` 等主题变量的继承链断裂（wujie 还会把子应用的 `document.body` 重定向到主应用 body，面板会落在主应用中）。Popover 对此**自动降级**：

- 检测到应用挂载容器（`app._container`）位于 shadow root 内时，面板自动传送到该容器（样式与主题变量继承链完整），无需任何配置；
- 非 shadow 环境（`getRootNode()` 返回 `Document`）行为不变，仍是 `body`，零破坏；
- 显式 `to` 优先级最高，可手动指定任意目标（建议指向**无 `overflow` 裁剪**的子应用根容器，否则大面板可能被裁剪）。

::: tip wujie degrade 降级模式
wujie 以 degrade 模式（iframe 保活）运行时页面无 shadowRoot，组件样式随子应用留在 iframe 内，此时建议显式传 `portal: false` 让面板留在原地。
:::

### Events

| 事件                   | 载荷                     | 说明                                 |
| ---------------------- | ------------------------ | ------------------------------------ |
| `update:open`          | `(open: boolean)`        | 展开状态变化时触发                   |
| `interact-outside`     | `(event)`                | 组件外交互（经 attrs 透传 Ark Root） |
| `pointer-down-outside` | `(event)`                | 组件外按下指针（经 attrs 透传）      |
| `focus-outside`        | `(event)`                | 焦点移出组件（经 attrs 透传）        |
| `escape-key-down`      | `(event: KeyboardEvent)` | 按下 Esc（经 attrs 透传）            |

### Slots

| 插槽      | 说明                                                 |
| --------- | ---------------------------------------------------- |
| `default` | 触发元素本体（asChild 语义合并，不产生额外包裹元素） |
| `content` | 气泡面板内容                                         |
| `header`  | 面板顶部内容（渲染在内容区上方，不带额外样式容器）   |
| `footer`  | 面板底部内容（渲染在内容区下方，不带额外样式容器）   |

渲染函数写法等价：

```ts
h(
  Popover,
  { align: "end", contentClass: "w-56 p-0" },
  {
    default: () => [h(TButton, () => "列设置")],
    content: () => h("div", "面板内容"),
  },
);
```

## 主题定制

Popover 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                          |
| ------------------------------------ | ----------------------------- |
| `--popover` / `--popover-foreground` | 气泡面板底色 / 文字           |
| `--border`                           | 面板边框色（`border`）        |
| `--radius`                           | 圆角基准（`rounded-md` 派生） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--popover: oklch(0.98 0.01 260)">
  <TPopover>
    <TButton>品牌色气泡</TButton>
    <template #content>品牌色气泡面板</template>
  </TPopover>
</div>
```
