---
title: Form 表单
description: 基于 TanStack Form 的表单状态与校验家族，provide/inject 自动接线 aria 无障碍属性。
---

# Form

表单状态与校验家族：基于 **TanStack Form**（`@tanstack/vue-form`）管理字段状态，配合 **Valibot**（Standard Schema）声明式校验，`FormLabel/FormControl/FormMessage` 经 provide/inject 自动接线 `id`、`aria-invalid`、`aria-describedby`，无需手动管理无障碍属性。

安装：

```bash
npx tu-design add form
```

会自动安装 `@tanstack/vue-form` 与 `valibot`。组件本体不依赖 valibot，任何 Standard Schema 兼容校验器（zod / arktype 等）均可直接传入 `validators`。

## 基础用法

`useForm()` 建实例，`TForm` 承载提交，`TFormField` + `v-slot="{ field }"` 逐字段接线：`field.state.value` 取值、`field.handleChange` 写值、`field.handleBlur` 失焦：

<DemoPreview file="form/FormDemo.vue" />

> **接线要点**：失焦用 `@focusout="field.handleBlur"` 而非 `@blur`——`focusout` 会冒泡且经 fallthrough 落到控件根元素，对 RadioGroup、DatePicker 等复合控件更稳；漏接会导致错误在再次选中/填写后不清除。

## 校验时机与写法

校验器经 `validators` 对象声明，**键决定触发时机**；字段级（`TFormField`）与表单级（`useForm`）可混用：

| 键         | 触发时机                 | 典型用途                   |
| ---------- | ------------------------ | -------------------------- |
| `onChange` | 值每次变化（键入即校验） | 字段级即时反馈             |
| `onBlur`   | 字段失焦                 | 克制一些的即时校验         |
| `onSubmit` | 表单提交时               | 表单级兜底校验（常用默认） |
| `onMount`  | 字段挂载                 | 回填后的预校验等           |

未声明的键不在该时机校验；**字段级校验器建议 `onBlur` + `onChange` 双键成对声明**——只写单键时另一时机不校验，会出现「键入修好了错误却不消失」或「提交不触发」的观感。提交时 `handleSubmit` 会先跑全部字段级校验、再跑表单级校验，任一失败都不会调用 `onSubmit`。

### 字段级两种写法

校验器的值可为 **Standard Schema**（valibot / zod / arktype）或**函数**（返回错误文案或 `undefined`）。换用 zod 等其他校验器需在项目内自行安装，schema 可直接互换：

```vue
<TFormField
  name="age"
  v-slot="{ field }"
  :validators="{
    onChange: v.pipe(v.number(), v.minValue(13, '必须年满 13 岁')),
    onBlur: ({ value }) => (value < 0 ? '不能为负数' : undefined),
  }"
>
```

### 校验时机对比

用户名键入触发字段级 `onChange`（上限）、失焦触发 `onBlur`（下限），提交时由表单级 `onSubmit` schema 兜底——三处错误都会经 `TFormMessage` 渲染：

<DemoPreview file="form/FormValidationDemo.vue" />

要点：`validators` 各键互不影响；清空输入失焦见下限错误，键入超长见上限错误，点「提交」追加表单级兜底错误。

### 跨字段校验（密码确认）

函数式校验器经 `fieldApi.form` 读取整表值，确认密码字段实时与密码字段比对：

<DemoPreview file="form/FormCrossFieldDemo.vue" />

对应写法：

```ts
validators: {
  onChange: ({ value, fieldApi }) =>
    value === fieldApi.form.state.values.password ? undefined : "两次输入不一致",
  onBlur: ({ /* 同款 */ }),
}
```

## 异步提交

`onSubmit` 返回 Promise 期间 `isSubmitting` 为真，`canSubmit` 同时转假禁用按钮，天然防重复提交：

<DemoPreview file="form/FormAsyncSubmitDemo.vue" />

## 编辑回填与重置

异步取数后 `form.setFieldValue()` 逐字段回填；`form.reset()` 恢复到 `defaultValues`：

<DemoPreview file="form/FormBackfillDemo.vue" />

要点：回填后可声明 `onMount` 校验器做预校验；重置按钮直接调 `form.reset()`，无需自行清空。

## 富控件集成

`TFormControl` 的 aria 接线对任意单一子控件生效——日期选择器同样只需四步接线（取值 / 写值 / 失焦 / 错误）：

<DemoPreview file="form/DatePickerFormDemo.vue" />

## 组件结构

| 组件               | 说明                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `TForm`            | 表单容器：拦截原生 `submit`（`novalidate`）并调用 `form.handleSubmit()`                                              |
| `TFormField`       | 字段作用域：渲染 TanStack `form.Field` 并向下提供字段上下文                                                          |
| `TFormItem`        | 字段布局容器：为子组件提供 `controlId`、`descriptionId`、`messageId` 上下文；校验错误时根元素带 `data-invalid`       |
| `TFormLabel`       | 字段标签：`for` 自动指向字段控件，校验错误时变红                                                                     |
| `TFormControl`     | 控件包装：把 `id`、`aria-invalid`、`aria-describedby` 合并到唯一子元素（多个子元素时开发期告警）                     |
| `TFormDescription` | 辅助说明：挂载即被 `aria-describedby` 关联，卸载自动收缩                                                             |
| `TFormMessage`     | 错误提示：默认渲染首个校验错误文案（兼容 `string` 与 `{ message }` 对象两种形态）；仅在有错误或传入 `message` 时渲染 |
| `TFormSubscribe`   | 提交状态订阅，配合 `type="submit"` 按钮使用                                                                          |

## API

### Props

#### TForm

```vue
<TForm :form="form">…</TForm>
```

| Prop    | 类型                                 | 默认值 | 说明               |
| ------- | ------------------------------------ | ------ | ------------------ |
| `form`  | `FormInstance`（`useForm()` 返回值） | —      | 表单实例，**必填** |
| `class` | `string`                             | —      | 追加/覆盖根样式    |

#### TFormField

```vue
<TFormField name="email" v-slot="{ field }">…</TFormField>
```

| Prop         | 类型                        | 默认值    | 说明                                                                         |
| ------------ | --------------------------- | --------- | ---------------------------------------------------------------------------- |
| `name`       | `string`                    | —         | 字段名，**必填**；控件 `id` 由它派生                                         |
| `validators` | `Record<string, validator>` | —         | 字段级校验：值为函数或 Standard Schema（如 valibot），按 `onChange` 等键声明 |
| `mode`       | `'value' \| 'array'`        | `'value'` | 字段模式：`array` 数组字段，解锁 `pushValue` / `removeValue` 等行操作        |

#### TFormItem

无 Props。

```vue
<TFormItem>…</TFormItem>
```

#### TFormLabel

```vue
<TFormLabel>邮箱</TFormLabel>
```

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `class` | `string` | —      | 追加/覆盖样式 |

#### TFormControl

```vue
<TFormControl>
  <TInput v-model="…" />
</TFormControl>
```

| Prop    | 类型     | 默认值 | 说明                |
| ------- | -------- | ------ | ------------------- |
| `class` | `string` | —      | 追加/覆盖子元素样式 |

#### TFormDescription

```vue
<TFormDescription>我们不会公开你的邮箱</TFormDescription>
```

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `class` | `string` | —      | 追加/覆盖样式 |

#### TFormMessage

```vue
<TFormMessage />
```

| Prop      | 类型     | 默认值 | 说明                                                           |
| --------- | -------- | ------ | -------------------------------------------------------------- |
| `message` | `string` | —      | 静态覆盖文案：传入后即使无错误也渲染（不走 aria-errormessage） |
| `class`   | `string` | —      | 追加/覆盖样式                                                  |

#### TFormSubscribe

无 Props。

```vue
<TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
  <TButton type="submit" :disabled="!canSubmit">
    {{ isSubmitting ? "提交中…" : "提交" }}
  </TButton>
</TFormSubscribe>
```

### Events

Form 家族不声明自定义事件。`TForm` 内部拦截原生 `submit`（`novalidate`）并调用 `form.handleSubmit()`；其余原生事件随 attrs 透传到根 `form` 元素：

```vue
<template>
  <TForm :form="form" @focus="…">…</TForm>
</template>
```

### Slots

| 组件               | 插槽                | 说明                                                                                                                                 |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `TForm`            | `default`           | 放置 `TFormField` 与 `TFormSubscribe`                                                                                                |
| `TFormField`       | `default`（作用域） | `{ field, state }`——`field.state.value` 取值、`field.handleChange` 写值、`field.handleBlur` 失焦、`field.state.meta.errors` 错误列表 |
| `TFormItem`        | `default`           | 字段布局内容（`TFormLabel` / `TFormControl` / `TFormDescription` / `TFormMessage`）                                                  |
| `TFormLabel`       | `default`           | 标签文本                                                                                                                             |
| `TFormControl`     | `default`           | 需且仅需一个子元素（多个子元素时开发期告警）                                                                                         |
| `TFormDescription` | `default`           | 说明文本                                                                                                                             |
| `TFormMessage`     | —                   | 无插槽，渲染错误文案                                                                                                                 |
| `TFormSubscribe`   | `default`（作用域） | `{ canSubmit, isSubmitting }`                                                                                                        |

## FAQ

### 如何手动设置 / 清除字段错误

`field.setErrorMap()` 按触发时机写入错误，`TFormMessage` 照常渲染；传 `undefined` 即清除：

```ts
// 在 TFormField 作用域插槽拿到 field 后（如异步查重的回调里）
field.setErrorMap({ onChange: "该用户名已被占用" }); // 设置
field.setErrorMap({ onChange: undefined }); // 清除
```

### 字段联动（一个字段变化更新另一个）

用 `form.useStore()` 订阅表单状态（返回 `Readonly<Ref>`），配合 `form.setFieldValue()` 写入：

```vue
<script setup lang="ts">
import { watch } from "vue";
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { price: 0, count: 1, total: 0 },
  onSubmit: async ({ value }) => console.log(value),
});

const state = form.useStore();
watch(
  () => [state.value.values.price, state.value.values.count] as const,
  ([price, count]) => form.setFieldValue("total", price * count),
);
</script>
```

### 动态增删字段（数组字段）

`TFormField` 声明 `mode="array"` 后字段值为数组，`field` 上有 `pushValue` / `insertValue` / `removeValue` / `swapValues` / `moveValue` 行操作方法；行内子字段用 `` `contacts[${i}].phone` `` 形式的嵌套 `TFormField`：

```vue
<TFormField name="contacts" v-slot="{ field }" mode="array">
  <div v-for="(_, i) in field.state.value" :key="i">
    <TFormField :name="`contacts[${i}].phone`" v-slot="{ field: row }">
      <TFormItem>
        <TFormLabel>联系人 {{ i + 1 }} 电话</TFormLabel>
        <TFormControl>
          <TInput
            :model-value="row.state.value"
            @update:model-value="row.handleChange"
            @blur="row.handleBlur"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>
    <TButton variant="ghost" @click="field.removeValue(i)">删除</TButton>
  </div>
  <TButton variant="outline" @click="field.pushValue({ phone: '' })">添加联系人</TButton>
</TFormField>
```

增删、移动行时，TanStack 会正确移位每行的校验与 touched 状态——删掉第 2 行不会让第 3 行继承它的错误。

## 主题定制

Form 家族是纯布局与文字组件，自身仅依赖少量文字色变量（完整机制见[主题](/guide/theming)）：

| 变量                 | 用途                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `--destructive`      | 校验错误文字：`TFormLabel` 校验失败变红、`TFormMessage` 错误文案 |
| `--muted-foreground` | 辅助说明文字（`TFormDescription`）                               |

控件本体（输入框、选择器等）的样式由 `TFormControl` 内部引用的基础组件承接，主题变量见对应组件文档（如 [Input](/components/input)、[Select](/components/select)）。

在任意容器上覆盖即得到作用域主题（含内部控件）：

```html
<div style="--destructive: oklch(0.6 0.22 25)">
  <TForm :form="form">…</TForm>
</div>
```
