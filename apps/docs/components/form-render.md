# FormRender

配置驱动的表单渲染器：`defineForm<T>()` 一步完成「字段定义 + 类型约束 + 表单实例」，`<FormRender>` 按 Tailwind 栅格自适应布局渲染。基于 **TanStack Form** 管理状态、**Valibot**（Standard Schema）声明式校验，展示层复用 `FormLabel/FormControl/FormMessage` 的 aria 自动接线。

与手写 `Form/FormField` 插槽式（见 [Form](/components/form)）的关系：插槽式适合复杂自定义布局；FormRender 适合「字段数量多、结构规整」的搜索表单与数据录入表单，消除每字段约 10 行的样板模板。

## 演示

搜索表单（联动显隐、日期范围、重置）：

<DemoPreview file="form-render/SearchFormDemo.vue" />

数据录入表单（valibot 校验、提交）：

<DemoPreview file="form-render/EntryFormDemo.vue" />

## 安装

```bash
npx tu-design add form-render
```

会自动安装 `@tanstack/vue-form` 与 `valibot`。校验器不限于 valibot——任何 Standard Schema 兼容实现（zod / arktype）均可传入 `schema`。

## 用法

```vue
<script setup lang="ts">
import * as v from "valibot";
import { defineForm } from "@tu-design/vue";

interface OrderQuery {
  keyword: string;
  status: string | null;
  range: [string, string] | null;
}

// 一步聚合：items 的 key 受 keyof OrderQuery 约束（拼错编译报错），
// default 自动派生 defaultValues，onSubmit 的 value 为 OrderQuery
const search = defineForm<OrderQuery>({
  items: [
    { key: "keyword", title: "关键词", default: "", render: (r) => r.input() },
    {
      key: "status",
      title: "状态",
      default: null,
      visible: (q) => q.keyword !== "", // 联动显隐（响应式）
      render: (r) => r.select({ items: ["待付款", "已付款"] }),
    },
    {
      key: "range",
      title: "日期",
      default: null,
      span: "full",
      render: (r) => r.dateRangePicker(),
    },
  ],
  schema: v.object({
    keyword: v.string(),
    status: v.nullable(v.string()),
    range: v.nullable(v.tuple([v.string(), v.string()])),
  }),
  onSubmit: async ({ value }) => {
    await fetch("/search", { method: "POST", body: JSON.stringify(value) });
  },
});
</script>

<template>
  <!-- 聚合式（推荐）：单 prop -->
  <FormRender :definition="search" searchable @search="onSearched" />

  <!-- 拆分式：与 <Form :form> 模式兼容，便于 items 复用 -->
  <!-- <FormRender :form="search.form" :items="search.items" searchable /> -->
</template>
```

- 搜索按钮点击 → `form.handleSubmit()` → 校验通过后执行 `onSubmit`，FormRender 再 emit `search`；校验失败不 emit（错误经 `FormMessage` 展示）。
- 重置按钮点击 → 回到 `items.default` 并 emit `reset`；`resetable` 缺省跟随 `searchable`。
- 也可直接用 `search.form`（TanStack 实例：`reset()/validate()/handleSubmit()`）与 `search.resetToDefaults()`。

## API

### `defineForm<T>(config)` / `useFormRender(options)`

`defineForm` 是 `useFormRender` 的聚合别名（后者供已有 form 实例/动态 items 的高级场景）。两者均须在组件 `setup` 中调用（TanStack `useForm` 内部依赖组件挂载）。

| config 字段    | 类型                                      | 说明                                                             |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `items`        | `FormRenderItem<T>[]`                     | 字段配置，`key` 严格 `keyof T`                                   |
| `schema?`      | Standard Schema                           | 映射到 TanStack `validators.onSubmit`，校验通过才执行 `onSubmit` |
| `onSubmit?`    | `({ value: T }) => void \| Promise<void>` | 校验通过后的业务提交                                             |
| `formOptions?` | `Record<string, unknown>`                 | 其余 TanStack useForm 选项透传                                   |

返回 `FormRenderDefinition<T>`：`{ items, form, resetToDefaults }`。

### `FormRender` props

| prop                        | 类型                   | 默认           | 说明                                        |
| --------------------------- | ---------------------- | -------------- | ------------------------------------------- |
| `definition`                | `FormRenderDefinition` | —              | 聚合式（优先于 form/items）                 |
| `form` / `items`            | 见上                   | —              | 拆分式                                      |
| `searchable` / `submitable` | `boolean`              | `false`        | 搜索 / 提交按钮（emit `search` / `submit`） |
| `resetable` / `cancelable`  | `boolean`              | 跟随前者       | 重置 / 取消按钮                             |
| `searchText` 等             | `string`               | 搜索/提交/重置 | 按钮文案                                    |
| `minWidth`                  | `number`               | `320`          | 栅格最小列宽 px（`auto-fill` 自适应列数）   |

事件：`search` / `submit` / `reset` / `cancel`。插槽：`actions`（自定义操作区）。

### `FormRenderItem<T>`

| 字段                                                      | 类型                                   | 说明                                       |
| --------------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| `key`                                                     | `keyof T`                              | 字段名（拼错编译报错）                     |
| `title`                                                   | `string`                               | label 文本                                 |
| `default?`                                                | `T[keyof T] \| (() => T[keyof T])`     | 默认值（值或同步工厂），派生 defaultValues |
| `render?`                                                 | `(r: WidgetRenders) => (ctx) => VNode` | widget 描述；缺省 `r.input()`              |
| `visible?`                                                | `boolean \| ((values: T) => boolean)`  | 联动显隐（响应式）                         |
| `span?`                                                   | `number \| "full"`                     | 栅格跨度（须 ≤ 实际列数；`"full"` 整行）   |
| `description?` / `placeholder?` / `hideLabel?` / `class?` | —                                      | 展示细节                                   |
| `validators?`                                             | `Record<string, unknown>`              | TanStack 字段级校验器透传                  |
| `componentProps?`                                         | `Record<string, unknown>`              | 逃逸口：合并到控件 props                   |

### widget 一览

`r.input` / `r.password` / `r.number` / `r.currency` / `r.textarea` / `r.select` / `r.checkbox` / `r.switch` / `r.radioGroup` / `r.treeSelect` / `r.cascader` / `r.slider` / `r.datePicker` / `r.monthPicker` / `r.yearPicker` / `r.dateRangePicker` / `r.render(fn)`（完全自定义逃逸口）。

**widget 参数 = 原组件全部 props（命名穿透）**：参数名与组件 prop 一一对应，组件 prop 变更时类型自动同步（如 `r.number({ min, max, step, formatOptions, disabled })`、`r.select({ items, open, lazyMount })`、`r.datePicker({ locale, min, max })`）。

以下字段由 FormRender 内部接管，widget 参数中**不可传**（编译期拦截）：

| 接管字段                                                                                  | 接管方                                    |
| ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| `modelValue` / `onUpdate:modelValue` / `checked` / `value` 及对应 `onUpdate:*` / `onBlur` | 受控绑定（`bindField`）                   |
| `invalid` / `class` / `id`                                                                | FormControl / FormItem 的 aria 与样式接线 |
| `defaultValue` / `defaultChecked`                                                         | 与 `items.default` 单一真相源冲突         |

特例：`r.input` / `r.textarea` 的 `placeholder` / `type` / `rows` 为原生 attr 透传；`r.radioGroup` / `r.treeSelect` / `r.cascader` 的选项字段为 `options`——与对应组件的选项 prop 同名（命名穿透：参数名即组件 prop 名）。极端场景仍有 `componentProps` 逃逸口兜底。

## 注意事项

- **须在 setup 中调用 `defineForm`**：TanStack `useForm` 内部依赖 `onMounted` 注册挂载。
- **`visible`（注意拼写，非 x-render 的 `visiable`）是响应式的**：FormRender 经 `useSelector` 订阅全量值，字段值变化即联动。
- `definition` / `form` props 不支持运行时切换（与 `<Form :form>` 同款静态约定）。
- **widget 参数显式传 `placeholder: undefined` 会覆盖 `item.placeholder`**（展开语义：键存在即覆盖，组件收到 undefined）；需要 item 级缺省时请省略该键。
- `r.select({ open })` / `r.datePicker({ open })` 等**弹层受控字段是半受控语义**：只传 `open` 而不配对 `onUpdate:open` 时弹层无法交互关闭；完整受控用法请两者一起传（组件原语义，非 FormRender 拦截范围）。
- 二期规划：条件 Tag 回显、高级搜索弹窗、`collapsed` 折叠、`group` 分组、组件/文本双模式。
