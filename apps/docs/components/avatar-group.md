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

### Slots

| 插槽      | 参数               | 说明                         |
| --------- | ------------------ | ---------------------------- |
| `default` | —                  | 组内头像（`<TAvatar>` 列表） |
| `rest`    | `{ rest: number }` | 溢出 `+N` 尾巴的自定义内容   |

::: tip 计数说明
`max` 折叠基于 `default` 插槽中元素级子节点计数，`v-if` 占位注释与文本节点会被忽略；建议插槽内只放置 `<TAvatar>` 元素。
:::
