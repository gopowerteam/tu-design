# Textarea

多行文本输入：纯样式封装（无需原语），支持 invalid 校验态与原生属性透传。

## 演示

<DemoPreview file="textarea/TextareaDemo.vue" />

## 安装

```bash
npx tu-design add textarea
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const bio = ref("");
</script>

<template>
  <TTextarea v-model="bio" placeholder="个人简介" />
</template>
```

## Props

| Prop      | 类型               | 默认值 | 说明                                            |
| --------- | ------------------ | ------ | ----------------------------------------------- |
| `v-model` | `string \| number` | —      | 输入值                                          |
| `invalid` | `boolean`          | —      | 校验失败态（`aria-invalid` + destructive 样式） |
| `class`   | `string`           | —      | 追加/覆盖根样式                                 |

其余原生属性（`placeholder`/`rows`/`disabled` 等）经透传直接生效。
