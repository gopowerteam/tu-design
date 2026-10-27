---
title: Avatar 头像
description: 头像，支持尺寸/形状、加载占位与失败回退（Ark UI）。
---

# Avatar

头像，支持尺寸/形状、加载占位与失败回退（Ark UI）。

安装：

```bash
npx tu-design add avatar
```

## 基础用法

::: info
组件基于 `@ark-ui/vue` 的 Avatar 无头实现，需安装 `@ark-ui/vue` 依赖（CLI 会提示）。
:::

<DemoPreview file="avatar/AvatarDemo.vue" />

## 尺寸与形状

`size` 支持 `xs/sm/md/lg` 预设与数字（像素）；`shape` 支持圆形/方形；`color` 覆盖 Fallback 背景；无内容且无图片时渲染内置用户图标：

<DemoPreview file="avatar/AvatarStatesDemo.vue" />

## 加载回退

图片加载失败或未提供 `src` 时渲染 Fallback 内容（通常为文字或图标）。配合 `fallback` 可在失败时切换备用图片（备用图也失败时回落 Fallback 并再次报错），通过 `@load` / `@error` 感知加载状态：

<DemoPreview file="avatar/AvatarFallback.vue" />

## 组件结构

Avatar 为单组件，无子组件；内部基于 Ark UI 的 `Avatar.Root` / `Avatar.Image` / `Avatar.Fallback` 三段结构，变体类由 `avatarVariants`（cva）统一生成。与 [AvatarGroup](/components/avatar-group) 为组合关系：组内 `size` 经 provide/inject 下发，子级显式 `size` 优先。

## API

### Props

| Prop        | 类型                                                       | 默认值   | 说明                                                                   |
| ----------- | ---------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `src`       | `string`                                                   | —        | 头像图片地址；加载失败或未提供时渲染 Fallback                          |
| `alt`       | `string`                                                   | —        | 图片替代文本                                                           |
| `fallback`  | `string`                                                   | —        | 图片加载失败时的备用图片地址（备用图也失败时回落 Fallback 并再次报错） |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg' \| number`                   | `md`     | 预设尺寸或自定义像素值                                                 |
| `shape`     | `'circle' \| 'square'`                                     | `circle` | 形状                                                                   |
| `color`     | `string`                                                   | —        | Fallback 背景色覆盖（默认主题 `bg-muted`）                             |
| `objectFit` | `'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | `cover`  | 图片在容器内的适应方式                                                 |
| `imgProps`  | `ImgHTMLAttributes`                                        | —        | 透传到底层 img 的原生属性（组件显式属性优先级更高）                    |
| `class`     | `string`                                                   | —        | 追加/覆盖样式（经 `cn` 合并）                                          |

### Events

| 事件    | 参数                   | 说明                                                   |
| ------- | ---------------------- | ------------------------------------------------------ |
| `load`  | `{ status: 'loaded' }` | 图片加载完成                                           |
| `error` | `{ status: 'error' }`  | 图片加载失败（使用 `fallback` 且其也失败时会再次触发） |

### Slots

| 插槽          | 说明                                                                |
| ------------- | ------------------------------------------------------------------- |
| `default`     | Fallback 内容（图片不可用时显示，通常为文字或图标；缺省为用户图标） |
| `placeholder` | 图片加载过程中的占位内容                                            |

### 头像组

多个头像的排列、折叠与展开见 [AvatarGroup](/components/avatar-group)。

## 主题定制

Avatar 样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量      | 用途                      |
| --------- | ------------------------- |
| `--muted` | 容器底色（Fallback 背景） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--muted: oklch(0.9 0.02 260)">
  <TAvatar />
</div>
```
