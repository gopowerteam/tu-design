# MonthPicker

月份选择器（`TMonthPicker`）：输入框 + 锁定月视图的日历弹层。值以 `"yyyy-MM"` 字符串受控，弹层卡片由 [`TCalendar`](/components/calendar) embedded 内嵌形态渲染（自动挂靠，零配置）。

## 演示

<DemoPreview file="month-picker/MonthPickerDemo.vue" />

## 安装

```bash
npx tu-design add month-picker
```

## Props / v-model

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

事件：`update:modelValue`、`update:open`。attrs（`id`/`aria-*`）转发给真实 input。

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
