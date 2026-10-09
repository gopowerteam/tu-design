# NumberInput

数字输入框：内置加减步进按钮与数值边界，值以 `number | null` 受控（空值归一为 `null`）。

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

## 插槽

| 插槽        | 作用域 | 说明                            |
| ----------- | ------ | ------------------------------- |
| `decrement` | —      | 减号按钮内容（默认内置 − 图标） |
| `increment` | —      | 加号按钮内容（默认内置 + 图标） |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部真实 `input`，供 `TFormLabel`/`TFormControl` 关联。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref<number | null>(42);
</script>

<template>
  <TNumberInput v-model="value" :min="0" :max="100" :step="1" />
</template>
```

## 与表单集成

经 `TFormControl` 包装对接 `TFormField`（`id` 自动落到内部 input）：

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
      />
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
