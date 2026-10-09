# PasswordInput

密码输入框：内置明文/掩码切换（Eye/EyeOff 图标），默认 `autocomplete="current-password"`。

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
| `disabled`        | `boolean`                              | 禁用态（`data-disabled`）                       |
| `invalid`         | `boolean`                              | 校验失败态（`data-invalid` + destructive 样式） |
| `class`           | `string`                               | 追加/覆盖样式（经 `cn` 合并）                   |

## 组件结构

```vue
<TPasswordInput>
  <TPasswordInputInput />
  <TPasswordInputVisibilityTrigger />
</TPasswordInput>
```

- `TPasswordInputVisibilityTrigger`：右侧绝对定位按钮，可见时显示 EyeOff（点击隐藏）、默认显示 Eye（点击查看）；默认插槽可替换图标。
- 家族子件必须在 `TPasswordInput` 内使用（开发期缺失上下文会告警并跳过渲染）。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const password = ref("");
const visible = ref(false);
</script>

<template>
  <TPasswordInput v-model="password" v-model:visible="visible">
    <TPasswordInputInput placeholder="请输入密码" />
    <TPasswordInputVisibilityTrigger />
  </TPasswordInput>
</template>
```

## 与表单集成

```vue
<TFormField name="password" v-slot="{ field }">
  <TFormItem>
    <TFormLabel>密码</TFormLabel>
    <TFormControl>
      <TPasswordInput
        :model-value="field.state.value"
        @update:model-value="field.handleChange"
        @blur="field.handleBlur"
      >
        <TPasswordInputInput />
        <TPasswordInputVisibilityTrigger />
      </TPasswordInput>
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
