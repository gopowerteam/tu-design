# YearPicker

年份选择器（`TYearPicker`）：输入框 + 锁定年视图的日历弹层（decade 网格）。值以 `"yyyy"` 字符串受控，弹层卡片由 [`TCalendar`](/components/calendar) embedded 内嵌形态渲染（自动挂靠，零配置）。

## 演示

<DemoPreview file="year-picker/YearPickerDemo.vue" />

## 安装

```bash
npx tu-design add year-picker
```

## Props / v-model

| 项              | 类型                   | 默认值         | 说明                                             |
| --------------- | ---------------------- | -------------- | ------------------------------------------------ |
| `v-model`       | `string \| null`       | `null`         | `"yyyy"`；空值归一 `null`                        |
| `defaultValue`  | `string`               | —              | 非受控初值                                       |
| `open`          | `boolean \| undefined` | —              | 弹层开合受控；`undefined` 走内部非受控           |
| `defaultOpen`   | `boolean`              | `false`        | 非受控初值                                       |
| `placeholder`   | `string`               | `"请选择年份"` |                                                  |
| `disabled`      | `boolean \| undefined` | —              | 禁用输入与触发                                   |
| `invalid`       | `boolean \| undefined` | —              | 校验失败态（红框 + aria-invalid）                |
| `readOnly`      | `boolean \| undefined` | —              | 只读（点击输入框不开弹层）                       |
| `min` / `max`   | `string`               | —              | 可选边界（`"yyyy"`，**含当年**）                 |
| `closeOnSelect` | `boolean`              | `true`         | 选中后是否自动关弹层                             |
| `locale`        | `string`               | `"zh-CN"`      | 年份文案跟随 locale                              |
| `class`         | `string`               | —              | 追加/覆盖样式（经 `cn` 合并，落在 Control 容器） |

事件：`update:modelValue`、`update:open`。attrs（`id`/`aria-*`）转发给真实 input。

## 语义说明

- **边界含端点**（闭区间）：`max="2026"` 时 2026 可选、2027 禁用。
- **min/max 为纯年粒度判定**：zag 年格可用性只比较年份（无 MonthPicker 的末日换算问题）。
- 年份网格按**年代**展示（如 2020–2029，4 列）；范围跟随已选值年代，无值时为当前年代；prev/next 切换年代。
- 键盘：方向键移动年焦点、Enter 选中、Esc 关弹层、输入框 ↓ 打开。
- 手动键入四位年份后 Enter 提交。

## 与 TMonthPicker 的差异

| 维度         | TMonthPicker     | TYearPicker            |
| ------------ | ---------------- | ---------------------- |
| 值域         | `"yyyy-MM"`      | `"yyyy"`               |
| 弹层         | 12 月网格        | decade 年网格          |
| min/max 换算 | max 换算当月末日 | 无换算（纯年粒度判定） |
