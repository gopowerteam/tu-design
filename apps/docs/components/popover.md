# Popover

气泡弹层：基于 Ark UI Popover 原语，点击触发，受控/非受控开关，Trigger 支持 asChild。

## 演示

<DemoPreview file="popover/PopoverDemo.vue" />

## 安装

```bash
npx tu-design add popover
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>

<template>
  <TPopover>
    <TPopoverTrigger>
      <TButton variant="outline">点我</TButton>
    </TPopoverTrigger>
    <TPopoverContent>气泡内容</TPopoverContent>
  </TPopover>
</template>
```

## Props

### Popover

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:open`    | `boolean` | —       | 展开状态；不传为非受控 |
| `default-open`    | `boolean` | `false` | 非受控时的初始状态     |
| `lazy-mount`      | `boolean` | `false` | 首次展开才挂载内容     |
| `unmount-on-exit` | `boolean` | `false` | 收起时卸载内容         |

默认插槽放置 `TPopoverTrigger` 与 `TPopoverContent`。

### PopoverTrigger

| Prop       | 类型      | 默认值  | 说明                   |
| ---------- | --------- | ------- | ---------------------- |
| `as-child` | `boolean` | `false` | 以插槽子元素为渲染目标 |

### PopoverContent

| Prop    | 类型     | 默认值 | 说明            |
| ------- | -------- | ------ | --------------- |
| `class` | `string` | —      | 追加/覆盖根样式 |
