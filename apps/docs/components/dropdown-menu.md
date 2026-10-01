# DropdownMenu

下拉菜单：基于 Ark UI Menu 原语，内置键盘导航、类型ahead 高亮与选中回调。`TDropdownMenuTrigger` 支持 `asChild`。

## 演示

<DemoPreview file="dropdown-menu/DropdownMenuDemo.vue" />

## 安装

```bash
npx tu-design add dropdown-menu
```

## 用法

```vue
<template>
  <TDropdownMenu>
    <TDropdownMenuTrigger as-child>
      <TButton>打开菜单</TButton>
    </TDropdownMenuTrigger>
    <TDropdownMenuContent>
      <TDropdownMenuLabel>操作分组</TDropdownMenuLabel>
      <TDropdownMenuItem value="edit" @select="onSelect">编辑</TDropdownMenuItem>
      <TDropdownMenuItem value="share" @select="onSelect">分享</TDropdownMenuItem>
      <TDropdownMenuSeparator />
      <TDropdownMenuItem value="delete" disabled>删除（禁用）</TDropdownMenuItem>
    </TDropdownMenuContent>
  </TDropdownMenu>
</template>
```

## Props

### TDropdownMenu

| Prop                             | 类型      | 默认值  | 说明                   |
| -------------------------------- | --------- | ------- | ---------------------- |
| `v-model:open`                   | `boolean` | —       | 受控开关；不传为非受控 |
| `default-open`                   | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount` / `unmount-on-exit` | `boolean` | `false` | 内容挂载策略           |

### 事件

| 事件     | 载荷                | 说明                                   |
| -------- | ------------------- | -------------------------------------- |
| `select` | `{ value: string }` | 菜单项被选中（点击或键盘 Enter）时触发 |

### TDropdownMenuItem

| Prop       | 类型      | 默认值   | 说明                 |
| ---------- | --------- | -------- | -------------------- |
| `value`    | `string`  | 自动生成 | 选中回调里回传的标识 |
| `disabled` | `boolean` | `false`  | 禁用项               |
| `class`    | `string`  | —        | 追加/覆盖样式        |

### TDropdownMenuTrigger / 其他

`asChild` 用法同 Dialog；`TDropdownMenuLabel`（分组标题）、`TDropdownMenuSeparator`（分隔线）、`TDropdownMenuGroup`（可访问分组）均为轻量包装。

## 说明

- 点击菜单项前需要先悬停高亮（真实交互的自然顺序），键盘 `↑`/`↓`/`Enter` 同样可用
- 选中后默认关闭菜单（Ark 原语 `close-on-select` 可调）
- 进出场动画基于 `data-[state]` + `tw-animate-css`
