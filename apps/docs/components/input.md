# Input

文本输入框，支持 v-model 与 attrs 透传。

## 演示

<DemoPreview file="input/InputDemo.vue" />

## 安装

```bash
npx tu-design add input
```

## Props / v-model

| 项        | 类型               | 说明                                            |
| --------- | ------------------ | ----------------------------------------------- |
| `v-model` | `string \| number` | 输入值（`defineModel`）                         |
| `invalid` | `boolean`          | 校验失败态（`aria-invalid` + destructive 样式） |
| `class`   | `string`           | 追加/覆盖样式（经 `cn` 合并）                   |

其余原生属性（`type`、`placeholder`、`disabled` 等）通过 `attrs` 透传到 `<input>`。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Input } from "@/components/ui/input";

const text = ref("");
</script>

<template>
  <TInput v-model="text" placeholder="请输入…" />
  <TInput type="email" disabled placeholder="禁用状态" />
</template>
```
