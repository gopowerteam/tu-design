# NumberInput

数字输入框：步进按钮 + 数值边界，值以 `number | null` 受控（空值归一为 `null`）。

## 演示

<DemoPreview file="number-input/NumberInputDemo.vue" />

## 安装

```bash
npx tu-design add number-input
```

## Props / v-model

| 项              | 类型                       | 说明                                            |
| --------------- | -------------------------- | ----------------------------------------------- |
| `v-model`       | `number \| null`           | 数值；空输入/非法输入归一为 `null`              |
| `min` / `max`   | `number`                   | 数值边界（越界输入被夹取）                      |
| `step`          | `number`                   | 步长（按钮与键盘 ↑↓ 共用），默认 `1`            |
| `formatOptions` | `Intl.NumberFormatOptions` | 展示格式（如 `{ notation: "percent" }`）        |
| `disabled`      | `boolean`                  | 禁用态（`data-disabled`）                       |
| `invalid`       | `boolean`                  | 校验失败态（`data-invalid` + destructive 样式） |
| `class`         | `string`                   | 追加/覆盖样式（经 `cn` 合并）                   |

## 组件结构

```vue
<TNumberInput>
  <TNumberInputDecrement>−</TNumberInputDecrement>
  <TNumberInputInput />
  <TNumberInputIncrement>+</TNumberInputIncrement>
</TNumberInput>
```

家族子件必须在 `TNumberInput` 内使用（开发期缺失上下文会告警并跳过渲染）。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref<number | null>(42);
</script>

<template>
  <TNumberInput v-model="value" :min="0" :max="100" :step="1">
    <TNumberInputDecrement>−</TNumberInputDecrement>
    <TNumberInputInput />
    <TNumberInputIncrement>+</TNumberInputIncrement>
  </TNumberInput>
</template>
```

## 与表单集成

`v-model` 直接对接 `TFormField` 作用域插槽：

```vue
<TFormField name="age" v-slot="{ field }">
  <TFormItem>
    <TFormLabel>年龄</TFormLabel>
    <TFormControl>
      <TNumberInput
        :model-value="field.state.value"
        :min="1"
        :max="120"
        @update:model-value="field.handleChange"
        @blur="field.handleBlur"
      >
        <TNumberInputDecrement>−</TNumberInputDecrement>
        <TNumberInputInput />
        <TNumberInputIncrement>+</TNumberInputIncrement>
      </TNumberInput>
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
