---
title: Popover 气泡
description: 点击触发的气泡弹层单组件，受控/非受控开关，默认插槽即触发元素。
---

# Popover

气泡弹层：基于 Ark UI Popover 原语的**单组件**——默认插槽是触发元素本体（asChild 语义，不额外包裹元素），面板内容放 `#content` 插槽，内部自动收编 Trigger/Positioner/Content。

安装：

```bash
npx tu-design add popover
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

通过 `align` 控制面板相对触发器的横轴对齐（`"start" | "center" | "end"`，默认 `"center"`），内部映射为 Ark 的 `positioning.placement`（主轴固定 `bottom`）：

<DemoPreview file="popover/PopoverAlign.vue" />

## 弹出方向

需要完整控制弹出方向时，经 attrs 透传 Ark 原语的 `positioning`，`placement` 支持四方向（空间不足时自动避让）。若 `positioning` 中**显式给出 `placement`，其优先级高于 `align`**：

<DemoPreview file="popover/PopoverPlacement.vue" />

## 内容定制

`#content` 插槽内可放任意内容，例如表单——提交后经 `v-model:open` 关闭气泡：

<DemoPreview file="popover/PopoverForm.vue" />

## API

### Props

| Prop              | 类型                           | 默认值     | 说明                                                     |
| ----------------- | ------------------------------ | ---------- | -------------------------------------------------------- |
| `v-model:open`    | `boolean`                      | —          | 展开状态；不传为非受控                                   |
| `default-open`    | `boolean`                      | `false`    | 非受控时的初始状态                                       |
| `lazy-mount`      | `boolean`                      | `false`    | 首次展开才挂载面板内容                                   |
| `unmount-on-exit` | `boolean`                      | `false`    | 收起时卸载面板内容                                       |
| `align`           | `"start" \| "center" \| "end"` | `"center"` | 面板横轴对齐；`positioning.placement` 显式给出时以其为准 |
| `content-class`   | `string`                       | —          | 追加/覆盖面板样式类（如 `"w-56 p-0"`）                   |
| `content-props`   | `Record<string, unknown>`      | —          | 透传到面板根元素的属性（`id`/`style`/`data-*` 等）       |

其余 attrs（如 `positioning`、`modal`）原样透传给 Ark Popover Root。

### Events

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 展开状态变化时触发 |

### Slots

| 插槽      | 说明                                                 |
| --------- | ---------------------------------------------------- |
| `default` | 触发元素本体（asChild 语义合并，不产生额外包裹元素） |
| `content` | 气泡面板内容                                         |

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
