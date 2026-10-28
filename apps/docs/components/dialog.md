---
title: Dialog 对话框
description: 模态对话框单组件，内置焦点圈定、Escape / 遮罩点击关闭与进出场动画。
---

# Dialog

模态对话框：基于 Ark UI Dialog 原语的**单组件**——`#trigger` 插槽放触发元素（asChild 语义，不额外包裹元素），`title` / `description` props 或 `#title` / `#description` 插槽提供标题与描述文案，默认插槽是弹层内容区，`#footer="{ close }"` 放底部操作。焦点圈定与还原、Escape / 遮罩点击关闭、滚动锁定与 `tw-animate-css` 进出场动画均已内建。

::: tip 单组件改造说明
原 `TDialogTrigger` / `TDialogContent` / `TDialogHeader` / `TDialogTitle` / `TDialogDescription` / `TDialogFooter` 子组件已全部收编进 `TDialog`；原 `TDialogClose` 由 `#footer` 作用域插槽注入的 `close` 函数替代——按钮的 `@click="close"` 即关闭，等价旧的关闭触发器语义。
:::

安装：

```bash
npx tu-design add dialog
```

依赖说明：registry 项 `dialog` 自动携带 `@ark-ui/vue` 运行时依赖与 `cn` 工具。

## 基础用法

`#trigger` 直接放触发元素（按钮、图标按钮等），`title` / `description` 传文案，默认插槽放弹层内容，`#footer="{ close }"` 放操作按钮：

<DemoPreview file="dialog/DialogDemo.vue" />

## 表单内嵌

默认插槽内放任意表单控件即可；`#footer` 默认右对齐主操作，小屏自动纵向堆叠。「取消」「保存更改」都用注入的 `close` 关闭：

<DemoPreview file="dialog/DialogForm.vue" />

## 受控用法

需要程序化控制开关时使用 `v-model:open`：外部代码直接改写 `open` ref 即可打开对话框，Escape / 遮罩关闭也会同步回写。触发器与程序化打开共用同一份状态：

<DemoPreview file="dialog/DialogControlled.vue" />

::: tip 受控语义
`open` prop 以 `default: undefined` 声明（禁用 Boolean casting）：**只有显式传入** `open` 才进入受控模式，不传即走内部非受控。受控时状态变化经 `update:open` 回写，未回写前视图不切换——适合在父组件中先行校验再决定开合的场景。
:::

## 尺寸

面板宽度通过 `content-class` 覆盖（默认 `sm:max-w-lg`），常用 `sm:max-w-sm` / `sm:max-w-xl` 两档：

<DemoPreview file="dialog/DialogSizes.vue" />

## API

### Props

| Prop                | 类型      | 默认值  | 说明                                |
| ------------------- | --------- | ------- | ----------------------------------- |
| `v-model:open`      | `boolean` | —       | 受控开关；不传为非受控              |
| `default-open`      | `boolean` | `false` | 非受控时的初始状态                  |
| `lazy-mount`        | `boolean` | `false` | 首次打开前不挂载内容                |
| `unmount-on-exit`   | `boolean` | `false` | 关闭动画结束后卸载内容              |
| `title`             | `string`  | —       | 标题文案（`#title` 插槽优先）       |
| `description`       | `string`  | —       | 描述文案（`#description` 插槽优先） |
| `show-close-button` | `boolean` | `true`  | 右上角内置关闭按钮                  |
| `content-class`     | `string`  | —       | 追加/覆盖面板样式（经 `cn` 合并）   |

### Events

`TDialog` 仅发出 `update:open`（`v-model:open` 的配套事件），无其他自定义事件：

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 开关状态变化时触发 |

### Slots

| 插槽                  | 说明                                                          |
| --------------------- | ------------------------------------------------------------- |
| `#trigger`            | 触发元素本体（asChild 语义合并，不产生额外包裹元素）          |
| `default`             | 弹层内容区（面板主体）                                        |
| `#title`              | 覆盖标题渲染（未提供时回退 `title` prop，皆无则不渲染）       |
| `#description`        | 覆盖描述渲染（未提供时回退 `description` prop，皆无则不渲染） |
| `#footer="{ close }"` | 底部操作区，作用域注入 `close` 函数（替代原 `TDialogClose`）  |

`title` / `description` / `#footer` 均未提供时对应区块不渲染任何 DOM。

渲染函数写法等价：

```ts
h(
  Dialog,
  { title: "归档项目", description: "归档后项目将变为只读" },
  {
    trigger: () => [h(TButton, () => "打开对话框")],
    default: () => h("p", "弹层内容区"),
    footer: ({ close }) => h(TButton, { onClick: close }, () => "取消"),
  },
);
```

## 可访问性

- `title` / `#title` 渲染为对话框标题并自动关联 `aria-labelledby`；`description` / `#description` 关联 `aria-describedby`（未提供文案时不渲染对应 part，也不会挂空引用）
- 打开时焦点移入对话框并圈定，关闭后还原到触发元素
- `Escape` 与遮罩点击默认关闭；右上角关闭按钮带 `sr-only` 文案「关闭」

## 主题定制

Dialog 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                          |
| -------------------- | ----------------------------- |
| `--background`       | 面板底色（`bg-background`）   |
| `--border`           | 面板边框色（`border`）        |
| `--muted-foreground` | 描述文字                      |
| `--ring`             | 右上角关闭按钮焦点环颜色      |
| `--radius`           | 圆角基准（`rounded-lg` 派生） |

遮罩（Backdrop）为固定 `bg-black/50`，不使用主题变量。

在任意容器上覆盖即得到作用域主题：

```html
<div style="--background: oklch(0.98 0.01 260)">
  <TDialog v-model:open="open" title="品牌色对话框">…</TDialog>
</div>
```
