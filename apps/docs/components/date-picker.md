---
title: "DatePicker 日期选择"
description: 日期选择器：输入框 + 日历弹层（月/年视图切换），支持手动键入、清空、`min`/`max` 边界与不可选日期谓词。
---

# DatePicker

日期选择器：输入框 + 日历弹层（月/年视图切换），支持手动键入、清空、`min`/`max` 边界与不可选日期谓词。`v-model` 为 `"yyyy-MM-dd"` 字符串，空值归一 `null`。

安装：

```bash
npx tu-design add date-picker
```

## 基础用法

<DemoPreview file="date-picker/DatePickerDemo.vue" />

## min/max 边界

`min`/`max` 为 `"yyyy-MM-dd"` 字符串（含当日），边界外与 `isDateUnavailable` 命中的格子呈禁用态，点击不产生值：

<DemoPreview file="date-picker/DatePickerMinMax.vue" />

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

## API

### Props

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

### Events

| 事件                 | 载荷             | 说明                                    |
| -------------------- | ---------------- | --------------------------------------- |
| `update:model-value` | `string \| null` | 值变化；`"yyyy-MM-dd"`，空值归一 `null` |
| `update:open`        | `boolean`        | 弹层开合                                |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

## 值与换算

- 输入框手动键入与回显默认走 **ISO 格式**（`yyyy-MM-dd`）：内部以 `format`/`parse` 钩子收敛，不随 locale 漂移。键入时须用 locale 分隔符（zag 按其清洗字符，zh-CN 为 `/`，如 `2026/10/09`），提交与 `v-model` 值仍为 ISO。
- 换算基于 `@internationalized/date` 纯日历解析，无时区参与；非法字符串（如 `"abc"`）被忽略，不产生脏值。
- 不可选日期（越界 / `isDateUnavailable` 命中）格子呈现禁用态，点击不产生值。

`isDateUnavailable` 的参数类型 `DateValue` 来自 `@ark-ui/vue` 的传递依赖：

```ts
import type { DateValue } from "@ark-ui/vue/date-picker";
```

## 路线图

日期家族后续变体均以独立组件交付，值类型遵循「string 家族 / ISO 化 / 区间一律 `[start, end]` 元组」约定。`MonthPicker` / `YearPicker` 已交付（`minView`/`maxView` 视图锁定实现，见 [TMonthPicker](/components/month-picker) / [TYearPicker](/components/year-picker)）：

| 变体              | 实现路径                           | v-model                    |
| ----------------- | ---------------------------------- | -------------------------- |
| `DateRangePicker` | zag 原生 `selectionMode="range"`   | `[string, string] \| null` |
| `WeekPicker`      | range 模式模拟点一格选整周         | `[string, string] \| null` |
| `QuarterPicker`   | 自定义格子渲染（12 月映射 4 季度） | 待定                       |

弹层卡片已合并为公开日历组件 [`TCalendar`](/components/calendar)（standalone 独立形态；两组件共用同一卡片内核，视觉打磨单点）。Full 尺寸日历为未来的 `size` 档：同一内核换自适应容器宽（流式布局 + 单元格插槽扩展），与形态维度正交组合，后续专项交付。

## 注意事项

- 弹层标题可点击切换月/年视图；`PrevTrigger`/`NextTrigger` 按当前视图步进。
- 输入框键入用 locale 分隔符（zh-CN 为 `/`，如 `2026/10/09`），补零必需；`v-model` 值恒为 ISO（`2026-10-09`）。
- 聚焦输入框后点击或按 `↓` 可打开日历；按 `Enter` 提交键入值。
