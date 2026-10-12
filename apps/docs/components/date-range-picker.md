# DateRangePicker

日期范围选择器：双月日历弹层（月/年视图切换），点选起点与终点。`v-model` 为 `["yyyy-MM-dd", "yyyy-MM-dd"]` **有序元组**（start ≤ end），空值归一 `null`。与 `TDatePicker` 同享值域约定与视觉规范。

## 演示

<DemoPreview file="date-range-picker/DateRangePickerDemo.vue" />

## 安装

```bash
npx tu-design add date-range-picker
```

## Props / v-model

| 项                  | 类型                           | 默认值             | 说明                                            |
| ------------------- | ------------------------------ | ------------------ | ----------------------------------------------- |
| `v-model`           | `[string, string] \| null`     | `null`             | 有序 ISO 元组（start ≤ end）；空值归一 `null`   |
| `defaultValue`      | `[string, string]`             | —                  | 非受控初值                                      |
| `open`              | `boolean`                      | —                  | 弹层开合受控（配合 `@update:open`）             |
| `defaultOpen`       | `boolean`                      | `false`            | 弹层初始展开                                    |
| `placeholder`       | `string`                       | `"请选择日期范围"` | 输入框占位符                                    |
| `disabled`          | `boolean`                      | —                  | 禁用态                                          |
| `invalid`           | `boolean`                      | —                  | 校验失败态（`data-invalid` + destructive 样式） |
| `readOnly`          | `boolean`                      | —                  | 只读态                                          |
| `min` / `max`       | `string`                       | —                  | 可选边界（`"yyyy-MM-dd"`，含当日）              |
| `isDateUnavailable` | `(date: DateValue) => boolean` | —                  | 不可选日期谓词                                  |
| `closeOnSelect`     | `boolean`                      | `true`             | 选完终点后自动关弹层（选起点不关）              |
| `numOfMonths`       | `number`                       | `2`                | 日视图并排月数                                  |
| `locale`            | `string`                       | `"zh-CN"`          | 文案与周起点跟随 locale（中文默认周一起始）     |
| `class`             | `string`                       | —                  | 追加/覆盖样式（经 `cn` 合并）                   |

事件：`update:modelValue`、`update:open`。

除声明 props 外，`id`、`aria-*` 等 attrs 会透传到内部 `input`，供 `TFormLabel`/`TFormControl` 关联。

## 值与交互

- **仅完整区间产生值**：点选起点为中间态，不产生 `update:modelValue`；选完终点才发出 `["yyyy-MM-dd", "yyyy-MM-dd"]`（乱序点选自动归一为 start ≤ end）。
- 受控用法下**无需在中间态回显**：内部保留选中进度，第二次点击总能完成区间（受控父组件延迟同步不影响交互）。
- 区间中段格子以浅色底标记（`data-in-range`），两端为主色（`data-selected`）。
- 边界与 `isDateUnavailable` 命中的格子呈禁用态，点击不产生值。
- 输入框以**格子点选**为准；键入支持为路线图事项，暂不承诺。

`isDateUnavailable` 的参数类型 `DateValue` 来自 `@ark-ui/vue` 的传递依赖：

```ts
import type { DateValue } from "@ark-ui/vue/date-picker";
```

## 用法

```vue
<script setup lang="ts">
import { ref } from "vue";

const range = ref<[string, string] | null>(["2026-10-01", "2026-10-15"]);
</script>

<template>
  <TDateRangePicker v-model="range" :min="'2026-01-01'" :max="'2026-12-31'" />
</template>
```

## 注意事项

- 弹层标题可点击切换月/年视图；`PrevTrigger`/`NextTrigger` 按当前视图步进。
- 清除按钮发出 `null`；受控时父组件把 `null` 回传即可复位。
- `numOfMonths` 改为 `1` 可切换单月范围选择。
