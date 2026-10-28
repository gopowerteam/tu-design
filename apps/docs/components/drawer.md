---
title: Drawer 抽屉
description: 从四方向滑出的侧边/顶底面板单组件，进出场动画随方向自适应，内置焦点圈定与 Escape / 遮罩点击关闭。
---

# Drawer

抽屉：基于 Ark UI Drawer 原语的**单组件**——`#trigger` 插槽放触发元素（asChild 语义，不额外包裹元素），`title` / `description` props 或 `#title` / `#description` 插槽提供标题与描述文案，默认插槽是正文区，`#footer="{ close }"` 放底部操作。`placement` 控制弹出方向（进出场动画随之自适应），`size` 控制档位尺寸。焦点圈定与还原、Escape / 遮罩点击关闭、滚动锁定与 `tw-animate-css` 滑动进出场动画均已内建。

安装：

```bash
npx tu-design add drawer
```

依赖说明：registry 项 `drawer` 自动携带 `@ark-ui/vue` 运行时依赖与 `cn` 工具。

## 基础用法

`#trigger` 直接放触发元素，`title` / `description` 传文案，默认插槽放正文，`#footer="{ close }"` 放操作按钮（默认右对齐）：

<DemoPreview file="drawer/DrawerDemo.vue" />

## 弹出方向

`placement` 支持 `top` / `right`（默认）/ `bottom` / `left` 四个方向；右侧抽屉从右滑入、左侧从左滑入、顶部从上滑入、底部从下滑入，退场对称滑出：

<DemoPreview file="drawer/DrawerPlacements.vue" />

## 受控用法

需要程序化控制开关时使用 `v-model:open`：外部代码直接改写 `open` ref 即可打开抽屉，Escape / 遮罩关闭也会同步回写。触发器与程序化打开共用同一份状态：

<DemoPreview file="drawer/DrawerControlled.vue" />

::: tip 受控语义
`open` prop 以 `default: undefined` 声明（禁用 Boolean casting）：**只有显式传入** `open` 才进入受控模式，不传即走内部非受控。受控时状态变化经 `update:open` 回写，未回写前视图不切换。
:::

## 底部操作区与尺寸

`#footer` 默认右对齐主操作，小屏自动纵向堆叠；`size` 在侧向（`left` / `right`）控制**宽度**、在顶/底向（`top` / `bottom`）控制**高度**，档位见 API 表：

<DemoPreview file="drawer/DrawerFooter.vue" />

## API

### Props

| Prop              | 类型                                     | 默认值      | 说明                                                    |
| ----------------- | ---------------------------------------- | ----------- | ------------------------------------------------------- |
| `v-model:open`    | `boolean`                                | —           | 受控开关；不传为非受控                                  |
| `default-open`    | `boolean`                                | `false`     | 非受控时的初始状态                                      |
| `lazy-mount`      | `boolean`                                | `false`     | 首次打开前不挂载内容                                    |
| `unmount-on-exit` | `boolean`                                | `false`     | 关闭动画结束后卸载内容                                  |
| `placement`       | `'top' \| 'right' \| 'bottom' \| 'left'` | `'right'`   | 弹出方向，进出场动画随之自适应                          |
| `size`            | `'sm' \| 'default' \| 'lg'`              | `'default'` | 尺寸档位（侧向=宽度，顶/底向=高度），自 `sm` 断点起生效 |
| `title`           | `string`                                 | —           | 标题文案（`#title` 插槽优先）                           |
| `description`     | `string`                                 | —           | 描述文案（`#description` 插槽优先）                     |
| `showCloseButton` | `boolean`                                | `true`      | 内置关闭按钮（`aria-label="关闭"`）                     |

### 尺寸档位

| `size`    | 侧向宽度（`left`/`right`） | 顶/底向高度（`top`/`bottom`） |
| --------- | -------------------------- | ----------------------------- |
| `sm`      | `sm:w-80`（20rem）         | `sm:h-64`（16rem）            |
| `default` | `sm:w-96`（24rem）         | `sm:h-80`（20rem）            |
| `lg`      | `sm:w-[40rem]`（40rem）    | `sm:h-[28rem]`（28rem）       |

档位均自 `sm`（640px）断点起生效：小于 `sm` 时侧向抽屉全宽（`w-full`）、顶/底向抽屉全高（`h-full`）。

### Events

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 开关状态变化时触发 |

### Slots

| 插槽                 | 说明                                                          |
| -------------------- | ------------------------------------------------------------- |
| `trigger`            | 触发元素本体（asChild 语义合并，不产生额外包裹元素）          |
| `default`            | 抽屉正文区                                                    |
| `title`              | 覆盖标题渲染（未提供时回退 `title` prop，皆无则不渲染）       |
| `description`        | 覆盖描述渲染（未提供时回退 `description` prop，皆无则不渲染） |
| `footer="{ close }"` | 底部操作区，作用域注入 `close` 函数                           |

## 无障碍

- `title` / `#title` 渲染为抽屉标题并自动关联 `aria-labelledby`；`description` / `#description` 关联 `aria-describedby`（未提供文案时不渲染对应 part，也不会挂空引用）
- 保留 Ark UI Drawer 原生的 `dialog` 语义（`role="dialog"` + `aria-modal`），打开时焦点移入并圈定，关闭后还原到触发元素
- `Escape` 与遮罩点击默认关闭；内置关闭按钮带 `aria-label="关闭"` 与 `sr-only` 文案

## 主题定制

Drawer 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                        |
| -------------------- | --------------------------- |
| `--background`       | 面板底色（`bg-background`） |
| `--border`           | 面板贴合边（`border-*`）    |
| `--muted-foreground` | 描述文字                    |
| `--ring`             | 关闭按钮焦点环颜色          |

遮罩（Backdrop）为固定 `bg-black/50`，不使用主题变量；暗色模式下遮罩与面板底色均随 `.dark` 的 token 自动切换，无需额外处理。

在任意容器上覆盖即得到作用域主题：

```vue
<template>
  <div class="[--background:oklch(0.96_0.01_250)] [--border:oklch(0.85_0.02_250)]">
    <TDrawer title="主题化抽屉">
      <template #trigger>
        <TButton variant="outline">打开</TButton>
      </template>
      <p class="text-sm text-muted-foreground">面板底色与边框已被作用域覆盖。</p>
    </TDrawer>
  </div>
</template>
```
