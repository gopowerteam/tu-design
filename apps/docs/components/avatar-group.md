---
title: AvatarGroup 头像组
description: 头像组，数量折叠、悬停展开与垂直排列。
---

# AvatarGroup

头像组，数量折叠、悬停展开与垂直排列。

安装（会一并添加 `avatar` 依赖组件）：

```bash
npx tu-design add avatar-group
```

## 用法

通过 `max` 折叠超出数量为 `+N` 尾巴（`rest` 插槽可自定义）；`expand-on-hover` 悬停展开全部；`vertical` 垂直排列；`size` 下发给子 Avatar（子级显式 `size` 优先）：

<DemoPreview file="avatar/AvatarGroupDemo.vue" />

## 组件结构

AvatarGroup 为容器组件，自身不渲染头像，由 `default` 插槽内的 `<TAvatar>` 组成，与 Avatar 为组合关系：`size` 经 `avatarGroupKey`（provide/inject）下发给子 Avatar（子级显式 `size` 优先）；溢出折叠的 `+N` 尾巴本身也是一个 `TAvatar`。

## API

### Props

| Prop            | 类型                                     | 默认值  | 说明                                           |
| --------------- | ---------------------------------------- | ------- | ---------------------------------------------- |
| `max`           | `number`                                 | —       | 最多展示的子头像数，超出折叠为 `+N` 尾巴       |
| `vertical`      | `boolean`                                | `false` | 垂直排列                                       |
| `size`          | `'xs' \| 'sm' \| 'md' \| 'lg' \| number` | —       | 下发给子 Avatar 的尺寸（子级显式 `size` 优先） |
| `expandOnHover` | `boolean`                                | `false` | 悬停展开全部头像（仅在设置了 `max` 时生效）    |
| `bordered`      | `boolean`                                | `false` | 子头像加描边（Group 内部分隔）                 |
| `class`         | `string`                                 | —       | 追加/覆盖样式（经 `cn` 合并）                  |

### Events

AvatarGroup 不声明自定义事件，原生事件随 attrs 透传到根元素；`expand-on-hover` 的悬停展开为组件内部行为，不对外 emit。

### Slots

| 插槽      | 参数               | 说明                         |
| --------- | ------------------ | ---------------------------- |
| `default` | —                  | 组内头像（`<TAvatar>` 列表） |
| `rest`    | `{ rest: number }` | 溢出 `+N` 尾巴的自定义内容   |

::: tip 计数说明
`max` 折叠基于 `default` 插槽中元素级子节点计数，`v-if` 占位注释与文本节点会被忽略；建议插槽内只放置 `<TAvatar>` 元素。
:::

## 主题定制

AvatarGroup 自身布局类不依赖主题 CSS 变量；`bordered` 描边由以下变量驱动（子头像底色另依赖 Avatar 的 `--muted`，见 [Avatar](/components/avatar) 主题定制）：

| 变量           | 用途                            |
| -------------- | ------------------------------- |
| `--background` | `bordered` 子头像描边色（ring） |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--background: oklch(0.98 0 0)">
  <TAvatarGroup bordered :max="3"><!-- 子 TAvatar --></TAvatarGroup>
</div>
```
