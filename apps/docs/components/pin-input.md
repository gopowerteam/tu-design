# PinInput

多格验证码输入：自动跳格、粘贴分发、填满触发 `complete`，适用于 OTP/短信验证码。

## 演示

<DemoPreview file="pin-input/PinInputDemo.vue" />

## 安装

```bash
npx tu-design add pin-input
```

## Props / v-model

| 项               | 类型                          | 说明                                            |
| ---------------- | ----------------------------- | ----------------------------------------------- |
| `v-model`        | `string[]`                    | 每格一个元素的数组                              |
| `type`           | `"numeric" \| "alphanumeric"` | 字符类型（`numeric` 时移动端弹数字键盘）        |
| `otp`            | `boolean`                     | OTP 语义（`autocomplete="one-time-code"`）      |
| `mask`           | `boolean`                     | 掩码显示（密码形态）                            |
| `placeholder`    | `string`                      | 空格占位符（默认 `○`）                          |
| `autoSubmit`     | `boolean`                     | 填满后提交最近表单                              |
| `blurOnComplete` | `boolean`                     | 填满后失焦                                      |
| `disabled`       | `boolean`                     | 禁用态（`data-disabled`）                       |
| `invalid`        | `boolean`                     | 校验失败态（`data-invalid` + destructive 样式） |
| `class`          | `string`                      | 追加/覆盖样式（经 `cn` 合并）                   |

## Events

| 事件       | 回调参数            | 说明               |
| ---------- | ------------------- | ------------------ |
| `complete` | `(value: string[])` | 全部格子填满时触发 |

## 组件结构

```vue
<TPinInput>
  <TPinInputInput v-for="(_, i) in 4" :key="i" :index="i" />
</TPinInput>
```

- **格数由 `TPinInputInput` 数量决定**，每个子件必须传 `index`（0 起的格序号）。
- 家族子件必须在 `TPinInput` 内使用（开发期缺失上下文会告警并跳过渲染）。
- 需要分隔符时直接在插槽里插普通元素（如 `<span class="text-muted-foreground">–</span>`）。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", ""]);
</script>

<template>
  <TPinInput v-model="value" type="numeric" otp @complete="onComplete">
    <TPinInputInput v-for="(_, i) in value" :key="i" :index="i" />
  </TPinInput>
</template>
```

## 与表单集成

`v-model`（`string[]`）直接对接 `TFormField`：

```vue
<TFormField name="code" v-slot="{ field }">
  <TFormItem>
    <TFormLabel>短信验证码</TFormLabel>
    <TFormControl>
      <TPinInput
        :model-value="field.state.value"
        type="numeric"
        @update:model-value="field.handleChange"
        @complete="onComplete"
      >
        <TPinInputInput v-for="(_, i) in field.state.value" :key="i" :index="i" />
      </TPinInput>
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
