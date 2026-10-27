---
title: FormRender 表单渲染器
description: 配置驱动的表单渲染器，defineForm 一步聚合字段定义与 TanStack Form 实例，Tailwind 栅格自适应布局。
---

# FormRender

配置驱动的表单渲染器：`defineForm<T>()` 一步完成「字段定义 + 类型约束 + 表单实例」，`<TFormRender>` 按 Tailwind 栅格自适应布局渲染。基于 **TanStack Form** 管理状态、**Valibot**（Standard Schema）声明式校验，展示层复用 `FormLabel/FormControl/FormMessage` 的 aria 自动接线。

与手写 `Form/FormField` 插槽式（见 [Form](/components/form)）的关系：插槽式适合复杂自定义布局；FormRender 适合「字段数量多、结构规整」的搜索表单与数据录入表单，消除每字段约 10 行的样板模板。

安装：

```bash
npx tu-design add form-render
```

会自动安装 `@tanstack/vue-form` 与 `valibot`。校验器不限于 valibot——任何 Standard Schema 兼容实现（zod / arktype）均可传入 `schema`。

## 基础用法

搜索表单（联动显隐、日期范围、重置）。`defineForm` 返回值也可拆分消费（`:form` + `:items`，与 `<TForm :form>` 模式兼容，便于 items 复用），见文末「提交与重置」：

<DemoPreview file="form-render/SearchFormDemo.vue" />

## 数据录入表单

数据录入表单（valibot 校验、提交）：

<DemoPreview file="form-render/EntryFormDemo.vue" />

## 组件结构

| 成员                     | 说明                                                                                                                                                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TFormRender`            | 栅格容器：逐字段经内部 `FormRenderField` 桥接复用 Form 家族（`TFormField` / `TFormItem` / `TFormLabel` / `TFormControl` / `TFormDescription` / `TFormMessage`），aria 接线自动继承；操作区内置搜索/重置/提交/取消按钮（可用 `actions` 插槽替换） |
| `defineForm<T>(config)`  | 聚合函数：`useFormRender` 的别名，一步返回 `{ items, form, resetToDefaults }`（须在组件 setup 中调用）                                                                                                                                           |
| `useFormRender(options)` | 底层组合函数：包装 TanStack `useForm`，供已有 form 实例 / 动态 items 的高级场景                                                                                                                                                                  |

## API

### Props

| prop                        | 类型                   | 默认           | 说明                                        |
| --------------------------- | ---------------------- | -------------- | ------------------------------------------- |
| `definition`                | `FormRenderDefinition` | —              | 聚合式（优先于 form/items）                 |
| `form` / `items`            | 见上                   | —              | 拆分式                                      |
| `searchable` / `submitable` | `boolean`              | `false`        | 搜索 / 提交按钮（emit `search` / `submit`） |
| `resetable` / `cancelable`  | `boolean`              | 跟随前者       | 重置 / 取消按钮                             |
| `searchText` 等             | `string`               | 搜索/提交/重置 | 按钮文案                                    |
| `minWidth`                  | `number`               | `320`          | 栅格最小列宽 px（`auto-fill` 自适应列数）   |

通过模板 ref 暴露实例成员：`form`（TanStack form 实例）、`items`、`resetToDefaults()`（重置到默认值；`definition` 聚合式走 `definition.resetToDefaults()`）。

### Events

| 事件     | 说明                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------- |
| `search` | 搜索按钮点击 → `form.handleSubmit()`，校验通过后 emit；校验失败不 emit（错误经 `FormMessage` 展示） |
| `submit` | 提交按钮点击 → `form.handleSubmit()`，校验通过后 emit；校验失败不 emit                              |
| `reset`  | 重置按钮点击：回到 `items.default`（`definition` 走 `resetToDefaults()`）后 emit                    |
| `cancel` | 取消按钮点击即 emit                                                                                 |

### Slots

| 插槽      | 说明                                                                        |
| --------- | --------------------------------------------------------------------------- |
| `actions` | 自定义操作区，替换内置搜索/重置/提交/取消按钮组（`col-span-full` 靠右布局） |

### defineForm / useFormRender（组合函数）

`defineForm` 是 `useFormRender` 的聚合别名（后者供已有 form 实例/动态 items 的高级场景）。两者均须在组件 `setup` 中调用（TanStack `useForm` 内部依赖组件挂载）。

| config 字段    | 类型                                      | 说明                                                             |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| `items`        | `FormRenderItem<T>[]`                     | 字段配置，`key` 严格 `keyof T`                                   |
| `schema?`      | Standard Schema                           | 映射到 TanStack `validators.onSubmit`，校验通过才执行 `onSubmit` |
| `onSubmit?`    | `({ value: T }) => void \| Promise<void>` | 校验通过后的业务提交                                             |
| `formOptions?` | `Record<string, unknown>`                 | 其余 TanStack useForm 选项透传                                   |

返回 `FormRenderDefinition<T>`：`{ items, form, resetToDefaults }`。

### FormRenderItem\<T\>

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

`r.input` / `r.password` / `r.number` / `r.currency` / `r.textarea` / `r.select` / `r.checkbox` / `r.switch` / `r.radioGroup` / `r.treeSelect` / `r.cascader` / `r.slider` / `r.datePicker` / `r.monthPicker` / `r.yearPicker` / `r.weekPicker` / `r.dateRangePicker` / `r.render(fn)`（完全自定义逃逸口）。

**widget 参数 = 原组件全部 props（命名穿透）**：参数名与组件 prop 一一对应，组件 prop 变更时类型自动同步（如 `r.number({ min, max, step, formatOptions, disabled })`、`r.select({ items, open, lazyMount })`、`r.datePicker({ locale, min, max })`）。

以下字段由 FormRender 内部接管，widget 参数中**不可传**（编译期拦截）：

| 接管字段                                                                                  | 接管方                                    |
| ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| `modelValue` / `onUpdate:modelValue` / `checked` / `value` 及对应 `onUpdate:*` / `onBlur` | 受控绑定（`bindField`）                   |
| `invalid` / `class` / `id`                                                                | FormControl / FormItem 的 aria 与样式接线 |
| `defaultValue` / `defaultChecked`                                                         | 与 `items.default` 单一真相源冲突         |

特例：`r.input` / `r.textarea` 的 `placeholder` / `type` / `rows` 为原生 attr 透传；`r.radioGroup` / `r.treeSelect` / `r.cascader` 的选项字段为 `options`——与对应组件的选项 prop 同名（命名穿透：参数名即组件 prop 名）。极端场景仍有 `componentProps` 逃逸口兜底。

## 提交与重置

- 搜索按钮点击 → `form.handleSubmit()` → 校验通过后执行 `onSubmit`，FormRender 再 emit `search`；校验失败不 emit（错误经 `FormMessage` 展示）。
- 重置按钮点击 → 回到 `items.default` 并 emit `reset`；`resetable` 缺省跟随 `searchable`。
- 也可直接用 `search.form`（TanStack 实例：`reset()/validate()/handleSubmit()`）与 `search.resetToDefaults()`。
- `defineForm` 的返回值也可拆分消费：`<TFormRender :form="search.form" :items="search.items" />`，与 `<TForm :form>` 模式兼容，便于 items 复用。

## 注意事项

- **须在 setup 中调用 `defineForm`**：TanStack `useForm` 内部依赖 `onMounted` 注册挂载。
- **`visible`（注意拼写，非 x-render 的 `visiable`）是响应式的**：FormRender 经 `useSelector` 订阅全量值，字段值变化即联动。
- `definition` / `form` props 不支持运行时切换（与 `<TForm :form>` 同款静态约定）。
- **widget 参数显式传 `placeholder: undefined` 会覆盖 `item.placeholder`**（展开语义：键存在即覆盖，组件收到 undefined）；需要 item 级缺省时请省略该键。
- `r.select({ open })` / `r.datePicker({ open })` 等**弹层受控字段是半受控语义**：只传 `open` 而不配对 `onUpdate:open` 时弹层无法交互关闭；完整受控用法请两者一起传（组件原语义，非 FormRender 拦截范围）。
- 二期规划：条件 Tag 回显、高级搜索弹窗、`collapsed` 折叠、`group` 分组、组件/文本双模式。

## 主题定制

FormRender 自身（栅格容器与操作区布局）不直接依赖任何主题 CSS 变量，样式由内部引用的组件承接，主题变量见对应文档：

| 内部承接                        | 组件                                   | 主题变量                                                                     |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------- |
| 标签 / 错误 / 说明文字          | Form 家族                              | `--destructive` / `--muted-foreground`，见 [Form](/components/form)          |
| 操作区搜索 / 提交 / 重置 / 取消 | Button（default / outline 变体）       | `--primary` / `--background` / `--input` 等，见 [Button](/components/button) |
| 各 widget 控件                  | Input / Select / DatePicker 等基础组件 | 见各组件文档                                                                 |

在容器上覆盖变量即可整体传导给内部组件：

```html
<div style="--primary: oklch(0.55 0.18 260)">
  <TFormRender :definition="form" searchable />
</div>
```
