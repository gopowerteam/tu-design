# Checkbox

复选框：基于 Ark UI Checkbox 原语，内置隐藏 input 与勾选图标，标签插槽点击同样可切换。

## 演示

<DemoPreview file="checkbox/CheckboxDemo.vue" />

## 安装

```bash
npx tu-design add checkbox
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const agreed = ref(false);
</script>

<template>
  <TCheckbox v-model:checked="agreed">同意服务条款</TCheckbox>
</template>
```

## Props

| Prop              | 类型      | 默认值  | 说明                   |
| ----------------- | --------- | ------- | ---------------------- |
| `v-model:checked` | `boolean` | —       | 选中状态；不传为非受控 |
| `default-checked` | `boolean` | `false` | 非受控时的初始状态     |
| `disabled`        | `boolean` | `false` | 禁用                   |
| `class`           | `string`  | —       | 追加/覆盖根样式        |

默认插槽作为文本标签渲染，点击同样触发切换。
