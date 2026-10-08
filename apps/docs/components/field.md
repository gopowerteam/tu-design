# Field

表单字段容器：Label/HelperText/ErrorText/输入控件经 Ark UI Field 上下文自动接线 `id`、`aria-invalid`、`aria-describedby` 与 `aria-errormessage`，无需手动管理无障碍属性。

## 演示

<DemoPreview file="field/FieldDemo.vue" />

## 安装

```bash
npx tu-design add field
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
const invalid = ref(false);
</script>

<template>
  <TField :invalid="invalid">
    <TFieldLabel>邮箱</TFieldLabel>
    <TFieldInput v-model="email" placeholder="you@example.com" />
    <TFieldHelperText>我们不会公开你的邮箱</TFieldHelperText>
    <TFieldErrorText>邮箱格式不正确</TFieldErrorText>
  </TField>
</template>
```

## Props

### Field

| Prop       | 类型      | 默认值  | 说明                               |
| ---------- | --------- | ------- | ---------------------------------- |
| `invalid`  | `boolean` | —       | 校验失败态（联动控件与 ErrorText） |
| `disabled` | `boolean` | `false` | 禁用整组控件                       |
| `required` | `boolean` | `false` | 必填标记                           |
| `class`    | `string`  | —       | 追加/覆盖根样式                    |

### 子组件

| 组件               | 说明                                                              |
| ------------------ | ----------------------------------------------------------------- |
| `TFieldLabel`      | 字段标签，自动 `for` 指向控件，invalid 时变红                     |
| `TFieldInput`      | 文本输入（样式与 `TInput` 一致），自动接线 id/aria 属性           |
| `TFieldTextarea`   | 多行输入（样式与 `TTextarea` 一致），自动接线 id/aria 属性        |
| `TFieldHelperText` | 辅助说明，经 `aria-describedby` 关联控件                          |
| `TFieldErrorText`  | 错误提示：仅在 `invalid=true` 时渲染，经 `aria-errormessage` 关联 |

`TFieldInput`/`TFieldTextarea` 的原生属性（`placeholder`/`rows`/`disabled` 等）经透传直接生效。
