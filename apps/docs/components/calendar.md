---
title: Calendar 日历
description: 紧凑日历卡，standalone 独立与 embedded 内嵌双形态。
---

# Calendar

日历（`TCalendar`）：紧凑日历卡，**双形态**——

- **`standalone` 独立形态**：独立使用，自带日历状态与 `v-model`，恒开展示，适合筛选面板、侧边栏等场景；
- **`embedded` 内嵌形态**：`TDatePicker` / `TDateRangePicker` 弹层内的卡片内核，自动挂靠宿主（零配置）。

安装：

```bash
npx tu-design add calendar
```

## 基础用法

<DemoPreview file="calendar/CalendarDemo.vue" />

## API

### Props

| 项                  | 类型                           | 默认值    | 说明                                                                |
| ------------------- | ------------------------------ | --------- | ------------------------------------------------------------------- |
| `v-model`           | `string \| null`               | `null`    | `"yyyy-MM-dd"`；空值归一 `null`。**仅 standalone**                  |
| `defaultValue`      | `string`                       | —         | 非受控初值。**仅 standalone**                                       |
| `mode`              | `"day" \| "month" \| "year"`   | `"day"`   | 视图形态，双语义见下节                                              |
| `numOfMonths`       | `number`                       | `1`       | 日视图并排月数（`>1` 时卡片自动加宽）                               |
| `min` / `max`       | `string`                       | —         | 可选边界（`"yyyy-MM-dd"`，含当日）。**仅 standalone**               |
| `isDateUnavailable` | `(date: DateValue) => boolean` | —         | 不可选日期谓词。**仅 standalone**                                   |
| `locale`            | `string`                       | `"zh-CN"` | 文案与周起点。**仅 standalone**；embedded 随宿主 Picker             |
| `week`              | `boolean`                      | `false`   | 周选择形态：日视图下整周高亮（与 `TWeekPicker` 配套）               |
| `class`             | `string`                       | —         | 追加/覆盖样式（经 `cn` 合并，落在卡片外壳，如 `rounded-md border`） |

### Events

| 事件                | 载荷                      | 说明                                                                  |
| ------------------- | ------------------------- | --------------------------------------------------------------------- |
| `update:modelValue` | `(value: string \| null)` | 选中值变化（`"yyyy-MM-dd"`，空值归一 `null`）。**仅 standalone 发出** |

## 形态判定

组件内部自动探测：渲染在 Picker 弹层内 → **`embedded` 内嵌形态**（纯卡片内核，不自建弹层，值域归宿主 Picker）；否则 → **`standalone` 独立形态**（自建日历状态，`v-model` 可用）。两种形态无需任何配置切换。

## mode 双语义

- **standalone**：`mode="month"` / `"year"` 即锁定语义——内部派生视图锁定（等价 `minView=maxView`），并隐藏切换钮；`"day"`（默认）保留月/年切换。
- **embedded**：`mode` 仅作渲染裁剪（只渲染对应视图块），锁定视图由宿主 Picker 的 Root 决定。

## 语义说明

- 卡片视觉常量收敛在 `CalendarBody.vue` 单文件内，日期家族的卡片视觉打磨只改这一处。
- embedded 形态下卡片是 **zag 上下文的消费者**：值与选择状态完全由宿主 `ArkDatePicker.Root` 管理，卡片不持有状态。
- 补位格（相邻月表内的上月尾/下月头）不可点击（naive excluded 语义），仅作日期连续性视觉提示；range 高亮只在所属月出现一次。

## 路线图

Full 尺寸日历为未来的 `size` 档（`size="card" | "full"`）：同一卡片内核换自适应容器宽（`w-full` 流式布局 + 单元格插槽扩展），与形态维度正交组合（如 standalone × full = 独立宽版日历），见 `TDatePicker` 文档的路线图。
