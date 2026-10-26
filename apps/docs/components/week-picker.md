---
title: "WeekPicker 周选择"
description: 周选择器：输入框 + 日历弹层，点任意可选日归一到所在周并整周高亮。
---

# WeekPicker

周选择器（`TWeekPicker`）：输入框 + 日历弹层。点任意可选日归一到所在周并**整周高亮**，值以 `"yyyy-MM-dd"`（所在周起始日）字符串受控，弹层卡片由 [`TCalendar`](/components/calendar) embedded 内嵌形态渲染（自动挂靠，零配置）。

安装：

```bash
npx tu-design add week-picker
```

## 基础用法

<DemoPreview file="week-picker/WeekPickerDemo.vue" />

## API

### Props

| 项                  | 类型                           | 默认值       | 说明                                                          |
| ------------------- | ------------------------------ | ------------ | ------------------------------------------------------------- |
| `v-model`           | `string \| null`               | `null`       | `"yyyy-MM-dd"`（所在周起始日）；空值归一 `null`               |
| `defaultValue`      | `string`                       | —            | 非受控初值（内部归一到所在周起始日）                          |
| `open`              | `boolean \| undefined`         | —            | 弹层开合受控；`undefined` 走内部非受控                        |
| `defaultOpen`       | `boolean`                      | `false`      | 非受控初值                                                    |
| `placeholder`       | `string`                       | `"请选择周"` |                                                               |
| `disabled`          | `boolean \| undefined`         | —            | 禁用输入与触发                                                |
| `invalid`           | `boolean \| undefined`         | —            | 校验失败态（红框 + aria-invalid）                             |
| `readOnly`          | `boolean \| undefined`         | —            | 只读（点击输入框不开弹层）                                    |
| `min` / `max`       | `string`                       | —            | 可选边界（`"yyyy-MM-dd"`，**含当日**）                        |
| `isDateUnavailable` | `(date: DateValue) => boolean` | —            | 不可选日期谓词；命中格不可点，同周其余日仍可选                |
| `closeOnSelect`     | `boolean`                      | `true`       | 选中后是否自动关弹层                                          |
| `locale`            | `string`                       | `"zh-CN"`    | 文案与**周起点**跟随 locale（zh-CN 周一起始、en-US 周日起始） |
| `class`             | `string`                       | —            | 追加/覆盖样式（经 `cn` 合并，落在 Control 容器）              |

### Events

| 事件                 | 载荷             | 说明                                                    |
| -------------------- | ---------------- | ------------------------------------------------------- |
| `update:model-value` | `string \| null` | 值变化；`"yyyy-MM-dd"`（所在周起始日），空值归一 `null` |
| `update:open`        | `boolean`        | 弹层开合                                                |

attrs（`id`/`aria-*`）转发给真实 input，供 `TFormLabel`/`TFormControl` 关联。

## 语义说明

- **点任意日 = 选整周**：点击所在周的任意可选日，提交值归一到该周起始日；弹层内整周格子同步高亮。
- **周起点跟随 locale**：基于 `Intl.Locale.weekInfo.firstDay`（zh-CN 周一、en-US 周日），非法 locale 兜底周一。
- **输入框回显**：`"2026-10-12 ~ 2026-10-18"` 整周区间；手动键入任意合法日期也会归一到所在周。
- **边界为日粒度**：`min`/`max` 逐格禁用；整周条带可能视觉越过边界，但边界外格子不可点选，选中值仍归一到周起点（可能早于 `min`），表单校验侧可用字符串比较兜底。
- 键盘：方向键移动日焦点、Enter 选中、Esc 关弹层、输入框 ↓ 打开。

## 与日期家族的差异

| 维度        | TDatePicker / TDateRangePicker | TMonthPicker / TYearPicker | TWeekPicker              |
| ----------- | ------------------------------ | -------------------------- | ------------------------ |
| 值域        | `"yyyy-MM-dd"` / 元组          | `"yyyy-MM"` / `"yyyy"`     | `"yyyy-MM-dd"`（周起点） |
| 弹层        | 日视图（可切月/年）            | 锁定月/年视图              | 日视图，选中即整周高亮   |
| `min`/`max` | `"yyyy-MM-dd"`                 | 月/年粒度                  | `"yyyy-MM-dd"`（日粒度） |
