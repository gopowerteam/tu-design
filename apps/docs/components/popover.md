---
title: Popover 气泡
description: 点击触发的气泡弹层，支持受控/非受控开关与 asChild。
---

# Popover

气泡弹层：基于 Ark UI Popover 原语，点击触发，受控/非受控开关，Trigger 支持 asChild。

安装：

```bash
npx tu-design add popover
```

## 基础用法

`TPopover`（根，状态容器）+ `TPopoverTrigger`（触发气泡）+ `TPopoverContent`（气泡面板，默认宽度 `w-72`，可通过 `class` 覆盖）。

<DemoPreview file="popover/PopoverDemo.vue" />

## 受控用法

需要程序化控制展开状态时使用 `v-model:open`：

```vue
<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>

<template>
  <TPopover v-model:open="open">
    <TPopoverTrigger>
      <TButton variant="outline">点我</TButton>
    </TPopoverTrigger>
    <TPopoverContent>受控气泡</TPopoverContent>
  </TPopover>
</template>
```

## 组件结构

| 组件              | 说明                               |
| ----------------- | ---------------------------------- |
| `TPopover`        | 根组件，状态容器（`v-model:open`） |
| `TPopoverTrigger` | 触发气泡，支持 `asChild`           |
| `TPopoverContent` | 气泡面板                           |

## API

### Props

#### TPopover

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:open`    | `boolean` | —       | 展开状态；不传为非受控 |
| `default-open`    | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount`      | `boolean` | `false` | 首次展开才挂载内容     |
| `unmount-on-exit` | `boolean` | `false` | 收起时卸载内容         |

#### TPopoverTrigger

| Prop       | 类型      | 默认值  | 说明                   |
| ---------- | --------- | ------- | ---------------------- |
| `as-child` | `boolean` | `false` | 以插槽子元素为渲染目标 |

#### TPopoverContent

| Prop    | 类型     | 默认值 | 说明            |
| ------- | -------- | ------ | --------------- |
| `class` | `string` | —      | 追加/覆盖根样式 |

### Events

`TPopover` 仅发出 `update:open`（`v-model:open` 的配套事件），无其他自定义事件：

| 事件          | 载荷              | 说明               |
| ------------- | ----------------- | ------------------ |
| `update:open` | `(open: boolean)` | 展开状态变化时触发 |

### Slots

全部子组件均只提供默认插槽；`TPopover` 的默认插槽放置 `TPopoverTrigger` 与 `TPopoverContent`。
