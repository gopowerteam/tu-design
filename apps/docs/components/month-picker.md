---
title: "MonthPicker 月份选择"
description: 月份选择器：输入框 + 锁定月视图的日历弹层，值以 yyyy-MM 字符串受控。
---

# MonthPicker

月份选择器（`TMonthPicker`）：输入框 + 锁定月视图的日历弹层。值以 `"yyyy-MM"` 字符串受控，弹层卡片由 [`TCalendar`](/components/calendar) embedded 内嵌形态渲染（自动挂靠，零配置）。

安装：

```bash
npx tu-design add month-picker
```

## 基础用法

<DemoPreview file="month-picker/MonthPickerDemo.vue" />

## 组件结构

MonthPicker 为复合组件（输入框 + 日历弹层），基于 `@ark-ui/vue` 的 `DatePicker`（zag）原语封装，与 `TDatePicker` 同构，差异仅在视图锁定与值域：

- **输入框 Control**：`Input`（`format`/`parse` 钩子收敛 `"yyyy-MM"`）+ `ClearTrigger` + `Trigger`；
- **视图锁定**：Root 传 `minView=maxView="month"`（机器钳制），弹层内无视图切换钮，prev/next 切换年份；
- **弹层内核**：内嵌 [`TCalendar`](/components/calendar) `mode="month"`（embedded 形态，仅渲染月视图块）。

## API

### Props

| 项              | 类型                   | 默认值         | 说明                                             |
| --------------- | ---------------------- | -------------- | ------------------------------------------------ |
| `v-model`       | `string \| null`       | `null`         | `"yyyy-MM"`；空值归一 `null`                     |
| `defaultValue`  | `string`               | —              | 非受控初值                                       |
| `open`          | `boolean \| undefined` | —              | 弹层开合受控；`undefined` 走内部非受控           |
| `defaultOpen`   | `boolean`              | `false`        | 非受控初值                                       |
| `placeholder`   | `string`               | `"请选择月份"` |                                                  |
| `disabled`      | `boolean \| undefined` | —              | 禁用输入与触发                                   |
| `invalid`       | `boolean \| undefined` | —              | 校验失败态（红框 + aria-invalid）                |
| `readOnly`      | `boolean \| undefined` | —              | 只读（点击输入框不开弹层）                       |
| `min` / `max`   | `string`               | —              | 可选边界（`"yyyy-MM"`，**含当月**）              |
| `closeOnSelect` | `boolean`              | `true`         | 选中后是否自动关弹层                             |
| `locale`        | `string`               | `"zh-CN"`      | 月名文案跟随 locale                              |
| `class`         | `string`               | —              | 追加/覆盖样式（经 `cn` 合并，落在 Control 容器） |

### Events

| 事件                 | 载荷             | 说明                                 |
| -------------------- | ---------------- | ------------------------------------ |
| `update:model-value` | `string \| null` | 值变化；`"yyyy-MM"`，空值归一 `null` |
| `update:open`        | `boolean`        | 弹层开合                             |

attrs（`id`/`aria-*`）转发给真实 input，供 `TFormLabel`/`TFormControl` 关联。

### Slots

MonthPicker 不声明自定义插槽（源码无 `<slot>` 出口）；弹层内容与卡片视觉由内嵌 `TCalendar` 承担。

## 语义说明

- **边界含端点**（闭区间）：`min="2026-03"` 时 3 月可选、2 月禁用。
- **max 内部换算当月末日**：zag 月格的可用性判定继承焦点日（`focusedValue.set({month})`），max 锚当月 1 日会误禁当月——组件内部自动换算到当月末日，使用方只需给月粒度串。
- 视图锁定由 `minView=maxView="month"` 承担（机器钳制），弹层内无视图切换钮；prev/next 切换年份。
- 键盘：方向键移动月焦点、Enter 选中、Esc 关弹层、输入框 ↓ 打开。
- 手动键入支持 `"2026/03"` 分隔符（zag 按 locale 清洗），提交值仍为 `"yyyy-MM"`。

## 与 TDatePicker 的差异

| 维度                                | TDatePicker         | TMonthPicker         |
| ----------------------------------- | ------------------- | -------------------- |
| 值域                                | `"yyyy-MM-dd"`      | `"yyyy-MM"`          |
| 弹层                                | 日视图（可切月/年） | 锁定月视图           |
| `min`/`max`                         | `"yyyy-MM-dd"`      | `"yyyy-MM"`          |
| `isDateUnavailable` / `numOfMonths` | 支持                | 无（月粒度无日语义） |

## 主题定制

MonthPicker 样式由以下 CSS 变量驱动——输入框侧常量收敛在 `date-shared/shared.ts`，弹层与卡片随内嵌 `TCalendar`（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `--input`                            | 输入框边框色（`border-input`）                                       |
| `--ring`                             | 输入框聚焦边框与聚焦环（`border-ring` / `ring-ring/50`）             |
| `--destructive`                      | `invalid` 态边框与环（`border-destructive` / `ring-destructive/20`） |
| `--popover` / `--popover-foreground` | 弹层面板底色/文字                                                    |
| `--primary` / `--primary-foreground` | 卡片选中月格底色/反色文字                                            |
| `--accent`                           | 卡片月格 hover 底色；卡片导航钮 hover                                |
| `--muted-foreground`                 | 清除/日历图标钮色；卡片导航钮                                        |
| `--foreground`                       | 图标钮 hover 色；卡片年份标题文字                                    |
| `--border`                           | 弹层边框色                                                           |
| `--radius`                           | 输入框与弹层圆角（`rounded-md` 派生）                                |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TMonthPicker v-model="month" />
</div>
```
