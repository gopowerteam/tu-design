# DatePicker

日期选择器：输入框 + 日历弹层（月/年视图切换），支持手动键入、清空、`min`/`max` 边界与不可选日期谓词。`v-model` 为 `"yyyy-MM-dd"` 字符串，空值归一 `null`。

## 演示

<DemoPreview file="date-picker/DatePickerDemo.vue" />

## 安装

```bash
npx tu-design add date-picker
```

## Props / v-model

| 项                  | 类型                           | 默认值         | 说明                                            |
| ------------------- | ------------------------------ | -------------- | ----------------------------------------------- |
| `v-model`           | `string \| null`               | `null`         | `"yyyy-MM-dd"`；空值归一 `null`                 |
| `defaultValue`      | `string`                       | —              | 非受控初值                                      |
| `open`              | `boolean`                      | —              | 弹层开合受控（配合 `@update:open`）             |
| `defaultOpen`       | `boolean`                      | `false`        | 弹层初始展开                                    |
| `placeholder`       | `string`                       | `"请选择日期"` | 输入框占位符                                    |
| `disabled`          | `boolean`                      | —              | 禁用态                                          |
| `invalid`           | `boolean`                      | —              | 校验失败态（`data-invalid` + destructive 样式） |
| `readOnly`          | `boolean`                      | —              | 只读态                                          |
| `min` / `max`       | `string`                       | —              | 可选边界（`"yyyy-MM-dd"`，含当日）              |
| `isDateUnavailable` | `(date: DateValue) => boolean` | —              | 不可选日期谓词                                  |
| `closeOnSelect`     | `boolean`                      | `true`         | 选中后是否自动关弹层                            |
| `locale`            | `string`                       | `"zh-CN"`      | 文案与周起点跟随 locale（中文默认周一起始）     |
| `class`             | `string`                       | —              | 追加/覆盖样式（经 `cn` 合并）                   |

事件：`update:modelValue`、`update:open`。

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

## 值与换算

- 输入框手动键入与回显默认走 **ISO 格式**（`yyyy-MM-dd`）：内部以 `format`/`parse` 钩子收敛，不随 locale 漂移。
- 换算基于 `@internationalized/date` 纯日历解析，无时区参与；非法字符串（如 `"abc"`）被忽略，不产生脏值。
- 不可选日期（越界 / `isDateUnavailable` 命中）格子呈现禁用态，点击不产生值。

`isDateUnavailable` 的参数类型 `DateValue` 来自 `@ark-ui/vue` 的传递依赖：

```ts
import type { DateValue } from "@ark-ui/vue/date-picker";
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const date = ref<string | null>("2026-10-09");
</script>

<template>
  <TDatePicker v-model="date" :min="'2026-01-01'" :max="'2026-12-31'" />
</template>
```

## 表单集成

校验走 Standard Schema（此处用 valibot 的 `isoDate`）：

<DemoPreview file="form/DatePickerFormDemo.vue" />

```vue
<TFormField name="startDate" v-slot="{ field }">
  <TFormItem>
    <TFormLabel>开始日期</TFormLabel>
    <TFormControl>
      <TDatePicker
        :model-value="field.state.value"
        @update:model-value="field.handleChange"
        @blur="field.handleBlur"
      />
    </TFormControl>
    <TFormMessage />
  </TFormItem>
</TFormField>
```

```ts
startDate: v.pipe(v.string(), v.isoDate("请选择有效日期")),
```

## 路线图

日期家族后续变体均以独立组件交付，值类型遵循「string 家族 / ISO 化 / 区间一律 `[start, end]` 元组」约定：

| 变体              | 实现路径                           | v-model                    |
| ----------------- | ---------------------------------- | -------------------------- |
| `DateRangePicker` | zag 原生 `selectionMode="range"`   | `[string, string] \| null` |
| `WeekPicker`      | range 模式模拟点一格选整周         | `[string, string] \| null` |
| `MonthPicker`     | `defaultView="month"`              | `string`（`"2026-10"`）    |
| `YearPicker`      | `defaultView="year"`               | `string`（`"2026"`）       |
| `QuarterPicker`   | 自定义格子渲染（12 月映射 4 季度） | 待定                       |

## 注意事项

- 弹层标题可点击切换月/年视图；`PrevTrigger`/`NextTrigger` 按当前视图步进。
- 输入框键入格式为 ISO（`2026-10-09`），补零必需。
