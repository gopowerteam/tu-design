# RadioGroup

单选组：基于 Ark UI Radio Group 原语，键盘 `↑`/`↓` 导航。

## 演示

<DemoPreview file="radio-group/RadioGroupDemo.vue" />

## 安装

```bash
npx tu-design add radio-group
```

## 用法

### 基础（v-model）

```vue
<script setup lang="ts">
import { ref } from "vue";

const plan = ref("weekly");
</script>

<template>
  <TRadioGroup v-model:value="plan">
    <TRadioGroupItem value="weekly">每周</TRadioGroupItem>
    <TRadioGroupItem value="monthly">每月</TRadioGroupItem>
  </TRadioGroup>
</template>
```

### options 声明式渲染

不写默认插槽、直接传 `options`，内部自动渲染选项；与默认插槽同时提供时插槽优先。

```vue
<template>
  <TRadioGroup
    v-model:value="interval"
    :options="[
      { label: '每天', value: 'daily' },
      { label: '每周', value: 'weekly', disabled: true },
      '从不',
    ]"
  />
</template>
```

### 水平排列与禁用

```vue
<template>
  <TRadioGroup default-value="zh" orientation="horizontal">
    <TRadioGroupItem value="zh">中文</TRadioGroupItem>
    <TRadioGroupItem value="en" disabled>English</TRadioGroupItem>
  </TRadioGroup>
</template>
```

### 表单集成与校验态

`name` 写入隐藏 input 供原生表单提交；`invalid` 时控件与选中圆点变红（zag 级联 `data-invalid`）。

```vue
<template>
  <FormField name="notify">
    <FormItem>
      <FormLabel>通知方式</FormLabel>
      <FormControl>
        <TRadioGroup v-model:value="notify" name="notify" invalid :options="notifyOptions" />
      </FormControl>
      <FormMessage />
    </FormItem>
  </FormField>
</template>
```

## Props

### TRadioGroup

| Prop            | 类型                                        | 默认值       | 说明                                        |
| --------------- | ------------------------------------------- | ------------ | ------------------------------------------- |
| `v-model:value` | `string`                                    | —            | 当前值；不传为非受控（内部 ref 维护）       |
| `default-value` | `string`                                    | —            | 非受控时的初始值                            |
| `options`       | `(string \| { label, value, disabled? })[]` | —            | 声明式选项；与默认插槽同传时插槽优先        |
| `orientation`   | `'horizontal' \| 'vertical'`                | `'vertical'` | 排列方向                                    |
| `disabled`      | `boolean`                                   | `false`      | 整组禁用                                    |
| `name`          | `string`                                    | —            | 隐藏 input 的表单提交字段名                 |
| `form`          | `string`                                    | —            | 关联的 form id                              |
| `required`      | `boolean`                                   | `false`      | 必填（输出 `aria-required`/input required） |
| `read-only`     | `boolean`                                   | `false`      | 只读                                        |
| `invalid`       | `boolean`                                   | `false`      | 校验无效态（级联 `data-invalid`）           |

### TRadioGroupItem

| Prop       | 类型      | 默认值  | 说明           |
| ---------- | --------- | ------- | -------------- |
| `value`    | `string`  | 必填    | 选中后写入组值 |
| `disabled` | `boolean` | `false` | 禁用该项       |

默认插槽作为选项文本渲染（zag `ItemText`，自动关联可访问性）。
