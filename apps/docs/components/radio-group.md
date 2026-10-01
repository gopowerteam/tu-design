# RadioGroup

单选组：基于 Ark UI Radio Group 原语，键盘 `↑`/`↓` 导航。

## 演示

<DemoPreview file="radio-group/RadioGroupDemo.vue" />

## 安装

```bash
npx tu-design add radio-group
```

## 用法

```vue
<template>
  <TRadioGroup v-model:value="plan" class="gap-3">
    <TRadioGroupItem value="weekly">每周</TRadioGroupItem>
    <TRadioGroupItem value="monthly">每月</TRadioGroupItem>
  </TRadioGroup>
</template>
```

## Props

### TRadioGroup

| Prop            | 类型                         | 默认值       | 说明                 |
| --------------- | ---------------------------- | ------------ | -------------------- |
| `v-model:value` | `string`                     | —            | 当前值；不传为非受控 |
| `default-value` | `string`                     | —            | 非受控时的初始值     |
| `orientation`   | `'horizontal' \| 'vertical'` | `'vertical'` | 排列方向             |
| `disabled`      | `boolean`                    | `false`      | 整组禁用             |

### TRadioGroupItem

| Prop       | 类型      | 默认值  | 说明           |
| ---------- | --------- | ------- | -------------- |
| `value`    | `string`  | 必填    | 选中后写入组值 |
| `disabled` | `boolean` | `false` | 禁用该项       |

默认插槽作为选项文本渲染（zag `ItemText`，自动关联可访问性）。
