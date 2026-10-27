---
title: "DateRangePicker 日期范围选择"
description: 日期范围选择器：双月日历弹层（月/年视图切换），点选起点与终点。
---

# DateRangePicker

日期范围选择器：双月日历弹层（月/年视图切换），点选起点与终点。`v-model` 为 `["yyyy-MM-dd", "yyyy-MM-dd"]` **有序元组**（start ≤ end），空值归一 `null`。与 `TDatePicker` 同享值域约定与视觉规范。

安装：

```bash
npx tu-design add date-range-picker
```

## 基础用法

<DemoPreview file="date-range-picker/DateRangePickerDemo.vue" />

## min/max 边界

`min`/`max` 为 `"yyyy-MM-dd"` 字符串（含当日），边界外与 `isDateUnavailable` 命中的格子呈禁用态，点击不产生值：

<DemoPreview file="date-range-picker/DateRangePickerMinMax.vue" />

## 组件结构

DateRangePicker 为复合组件（起/止双输入框 + 日历弹层），基于 `@ark-ui/vue` 的 `DatePicker`（zag）原语封装，`Root` 走 `selection-mode="range"`：

- **输入框 Control**：两个 `Input`（`index` 0/1，中间「→」分隔图标）+ `ClearTrigger` + `Trigger`；
- **弹层**：`Teleport` 到 body 的 `Positioner`/`Content`——脱离表单 DOM，隔离外层 `group-hover` 污染与 overflow 裁剪；
- **弹层内核**：内嵌 [`TCalendar`](/components/calendar)（embedded 形态，`numOfMonths` 透传，默认 `2` 双月）。

受控桥为 **mirror 模式**：range 两步交互下 zag 恒以内部镜像值为准（父组件回显滞后不会吃掉 pending start），对外 emit 归一为有序元组，两步选中进度由内部保留（见「值与交互」）。

## API

### Props

| 项                  | 类型                           | 默认值             | 说明                                            |
| ------------------- | ------------------------------ | ------------------ | ----------------------------------------------- |
| `v-model`           | `[string, string] \| null`     | `null`             | 有序 ISO 元组（start ≤ end）；空值归一 `null`   |
| `defaultValue`      | `[string, string]`             | —                  | 非受控初值                                      |
| `open`              | `boolean`                      | —                  | 弹层开合受控（配合 `@update:open`）             |
| `defaultOpen`       | `boolean`                      | `false`            | 弹层初始展开                                    |
| `placeholder`       | `string`                       | `"请选择日期范围"` | 输入框占位符（起/止双框同占位）                 |
| `disabled`          | `boolean`                      | —                  | 禁用态                                          |
| `invalid`           | `boolean`                      | —                  | 校验失败态（`data-invalid` + destructive 样式） |
| `readOnly`          | `boolean`                      | —                  | 只读态                                          |
| `min` / `max`       | `string`                       | —                  | 可选边界（`"yyyy-MM-dd"`，含当日）              |
| `isDateUnavailable` | `(date: DateValue) => boolean` | —                  | 不可选日期谓词                                  |
| `closeOnSelect`     | `boolean`                      | `true`             | 选完终点后自动关弹层（选起点不关）              |
| `numOfMonths`       | `number`                       | `2`                | 日视图并排月数                                  |
| `locale`            | `string`                       | `"zh-CN"`          | 文案与周起点跟随 locale（中文默认周一起始）     |
| `class`             | `string`                       | —                  | 追加/覆盖样式（经 `cn` 合并）                   |

### Events

| 事件                 | 载荷                       | 说明                                                  |
| -------------------- | -------------------------- | ----------------------------------------------------- |
| `update:model-value` | `[string, string] \| null` | 值变化；有序 ISO 元组（start ≤ end），空值归一 `null` |
| `update:open`        | `boolean`                  | 弹层开合                                              |

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

### Slots

DateRangePicker 不声明自定义插槽（源码无 `<slot>` 出口）；弹层内容与卡片视觉由内嵌 `TCalendar` 承担。

## 值与交互

- **仅完整区间产生值**：点选起点为中间态，不产生 `update:modelValue`；选完终点才发出 `["yyyy-MM-dd", "yyyy-MM-dd"]`（乱序点选自动归一为 start ≤ end）。
- 受控用法下**无需在中间态回显**：内部保留选中进度，第二次点击总能完成区间（受控父组件延迟同步不影响交互）。
- 区间中段格子以浅色底标记（`data-in-range`），两端为主色（`data-selected`）。
- 边界与 `isDateUnavailable` 命中的格子呈禁用态，点击不产生值。
- 输入框为**起/止双框**（zag 原生 range 结构，中间「→」分隔）：回显时起值入左框、止值入右框；点任一框开弹层，以**格子点选**为准；键入支持为路线图事项，暂不承诺。

`isDateUnavailable` 的参数类型 `DateValue` 来自 `@ark-ui/vue` 的传递依赖：

```ts
import type { DateValue } from "@ark-ui/vue/date-picker";
```

## 注意事项

- 弹层标题可点击切换月/年视图；`PrevTrigger`/`NextTrigger` 按当前视图步进。
- 清除按钮发出 `null`；受控时父组件把 `null` 回传即可复位。
- `numOfMonths` 改为 `1` 可切换单月范围选择。
- 相邻月的补位日期仅作区间连续性的视觉提示（灰字），**不可点击选中**（对齐 naive excluded 语义）；range/选中高亮只在日期所属月份的表内出现一次，不会跨表重复。

## 主题定制

DateRangePicker 样式由以下 CSS 变量驱动——输入框侧常量收敛在 `date-shared/shared.ts`，弹层与卡片随内嵌 `TCalendar`（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- |
| `--input`                            | 输入框边框色（`border-input`）                                       |
| `--ring`                             | 输入框聚焦边框与聚焦环（`border-ring` / `ring-ring/50`）             |
| `--destructive`                      | `invalid` 态边框与环（`border-destructive` / `ring-destructive/20`） |
| `--popover` / `--popover-foreground` | 弹层面板底色/文字                                                    |
| `--primary` / `--primary-foreground` | 卡片选中格与 range 两端底色/反色文字；今日文字色                     |
| `--accent`                           | 卡片格子 hover/键盘焦点底色；卡片导航钮 hover                        |
| `--muted-foreground`                 | 清除/日历图标钮与「→」分隔图标；卡片表头星期与导航钮                 |
| `--foreground`                       | 图标钮 hover 色；卡片视图标题文字                                    |
| `--border`                           | 弹层边框色；卡片表头底边                                             |
| `--radius`                           | 输入框与弹层圆角（`rounded-md` 派生）                                |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TDateRangePicker v-model="range" />
</div>
```
