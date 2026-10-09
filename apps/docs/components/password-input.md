# PasswordInput

密码输入框：内置明文/掩码切换按钮（Eye/EyeOff 图标，带 `aria-label`/`aria-pressed` 语义），默认 `autocomplete="current-password"`。

## 演示

<DemoPreview file="password-input/PasswordInputDemo.vue" />

## 安装

```bash
npx tu-design add password-input
```

## Props / v-model

| 项                | 类型                                   | 说明                                            |
| ----------------- | -------------------------------------- | ----------------------------------------------- |
| `v-model`         | `string`                               | 密码值                                          |
| `v-model:visible` | `boolean`                              | 明文显示状态（默认掩码）                        |
| `autoComplete`    | `"current-password" \| "new-password"` | 默认 `"current-password"`                       |
| `placeholder`     | `string`                               | 输入框占位符                                    |
| `disabled`        | `boolean`                              | 禁用态（输入框与切换按钮同时禁用）              |
| `invalid`         | `boolean`                              | 校验失败态（`data-invalid` + destructive 样式） |
| `class`           | `string`                               | 追加/覆盖样式（经 `cn` 合并）                   |

## 插槽

| 插槽              | 作用域        | 说明                                            |
| ----------------- | ------------- | ----------------------------------------------- |
| `visibility-icon` | `{ visible }` | 切换按钮图标（可见时显示 EyeOff，默认显示 Eye） |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const password = ref("");
const visible = ref(false);
</script>

<template>
  <TPasswordInput
    v-model="password"
    v-model:visible="visible"
    placeholder="请输入密码"
    auto-complete="new-password"
  />
</template>
```

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`：

```vue
<TFormField name="password" v-slot="{ field }">
  <TFormItem>
    <TFormLabel>密码</TFormLabel>
    <TFormControl>
      <TPasswordInput
        :model-value="field.state.value"
        @update:model-value="field.handleChange"
        @blur="field.handleBlur"
      />
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
