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

独立展示的日历面板（非弹层）：`v-model` 绑定 `"yyyy-MM-dd"` 字符串（空值归一 `null`）。点击日期选中，点标题上钻月/年视图，左右箭头翻页：

<DemoPreview file="calendar/CalendarDemo.vue" />

## 视图形态

`mode` 锁定视图：`"month"` / `"year"` 将卡片锁定在对应粒度（`"month"` 仍可点年份标题上钻），`"day"`（默认）保留完整切换链：

<DemoPreview file="calendar/CalendarMonthDemo.vue" />

<DemoPreview file="calendar/CalendarYearDemo.vue" />

## 可选范围与禁用日期

`min` / `max` 限定可选窗口（界外日期置灰不可点）；`isDateUnavailable` 接收谓词函数，命中的日期划线置灰、不可选中：

<DemoPreview file="calendar/CalendarBoundsDemo.vue" />

## 周选择

`week` 开启周选择形态：点击任意一天即选中整周（整行实心高亮，hover 有整周预览），周起点跟随 `locale`（默认 `zh-CN` 周一起）：

<DemoPreview file="calendar/CalendarWeekDemo.vue" />

## 多月并排

`numOfMonths` 让日视图并排展示多个月（卡片自动加宽），适合跨月选择场景：

<DemoPreview file="calendar/CalendarMultiMonthDemo.vue" />

## 组件结构

Calendar 为复合组件，基于 `@ark-ui/vue` 的 `DatePicker`（zag）原语封装，由三部分构成：

- `Calendar.vue` — 形态壳：独立使用时自建 `Root`（`:open="true"` 恒开，无 Positioner，就地渲染，值状态自持）；渲染在 Picker 弹层内时经 `CALENDAR_IN_PICKER` 注入标记探测宿主，退化为纯卡片内核（embedded），值与选择状态归宿主 Root；
- `CalendarBody.vue` — 卡片内核：day/month/year 三视图表格。日视图为双层格子（全格命中 trigger + 24px 视觉圆点 dot，状态经 `group-*` 传导）；`week` 形态整周高亮由本文件按同周判定（`isSameWeek`，跟随 locale）补 `data-week-selected` 实现，不走 zag range 模式；
- `CalendarNav.vue` — 视图导航条（Prev/Next/ViewTrigger），必须渲染在对应 `View` 子树内（`view` 参数由 View provide）。

后两者为内部件，不对外导出；卡片视觉常量收敛在 `CalendarBody.vue` 单文件内。

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

### Slots

Calendar 不声明自定义插槽（源码无 `<slot>` 出口）；模板内的 `Context v-slot` 为 zag 内部上下文消费，非对外插槽。

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

## 主题定制

Calendar 卡片样式由以下 CSS 变量驱动（完整机制见[主题](/guide/theming)）：

| 变量                                 | 用途                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `--primary` / `--primary-foreground` | 选中格与整周条带底色/反色文字；range 中段与整周 hover 预览浅条带；今日文字 |
| `--accent`                           | 格子 hover 与键盘焦点底色；导航钮 hover 底色                               |
| `--muted-foreground`                 | 表头星期文字；prev/next 导航钮图标色                                       |
| `--foreground`                       | 视图标题（月份/年份/年代）文字                                             |
| `--border`                           | 表头底边框色                                                               |
| `--radius`                           | 导航钮圆角（`rounded-md` 派生）                                            |

在任意容器上覆盖即得到作用域主题：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TCalendar v-model="date" />
</div>
```
