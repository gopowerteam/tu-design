# PinInput

多格验证码输入：`length` 指定格数，自动跳格、粘贴分发、填满触发 `complete`，适用于 OTP/短信验证码。

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
| `length`         | `number`                      | 格数，默认 `4`                                  |
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

## 插槽

| 插槽        | 作用域 | 说明                               |
| ----------- | ------ | ---------------------------------- |
| `separator` | —      | 格间分隔内容，渲染 `length - 1` 次 |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到**首格** input，供 `TFormLabel`/`TFormControl` 关联。

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const value = ref<string[]>(["", "", "", ""]);

function onComplete(v: string[]) {
  console.log("验证码填写完成", v);
}
</script>

<template>
  <TPinInput v-model="value" type="numeric" otp :length="4" @complete="onComplete" />
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
        :length="4"
        @update:model-value="field.handleChange"
        @complete="onComplete"
      />
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```
