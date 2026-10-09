# Form

表单状态与校验家族：基于 **TanStack Form**（`@tanstack/vue-form`）管理字段状态，配合 **Valibot**（Standard Schema）声明式校验，`FormLabel/FormControl/FormMessage` 经 provide/inject 自动接线 `id`、`aria-invalid`、`aria-describedby`，无需手动管理无障碍属性。

## 演示

<DemoPreview file="form/FormDemo.vue" />

## 安装

```bash
npx tu-design add form
```

会自动安装 `@tanstack/vue-form` 与 `valibot`。组件本体不依赖 valibot，任何 Standard Schema 兼容校验器（zod / arktype 等）均可直接传入 `validators`。

## 用法

```vue
<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { email: "", password: "" },
  validators: {
    onSubmit: v.object({
      email: v.pipe(v.string(), v.email("邮箱格式不正确")),
      password: v.pipe(v.string(), v.minLength(8, "至少 8 位")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});
</script>

<template>
  <TForm :form="form">
    <TFormField name="email" v-slot="{ field }">
      <TFormLabel>邮箱</TFormLabel>
      <TFormControl>
        <TInput
          :model-value="field.state.value"
          @update:model-value="field.handleChange"
          @blur="field.handleBlur"
        />
      </TFormControl>
      <TFormDescription>我们不会公开你的邮箱</TFormDescription>
      <TFormMessage />
    </TFormField>

    <TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
      <TButton type="submit" :disabled="!canSubmit">
        {{ isSubmitting ? "提交中…" : "提交" }}
      </TButton>
    </TFormSubscribe>
  </TForm>
</template>
```

## 校验时机与写法

校验器经 `validators` 对象声明，**键决定触发时机**；字段级（`TFormField`）与表单级（`useForm`）可混用：

| 键         | 触发时机                 | 典型用途                   |
| ---------- | ------------------------ | -------------------------- |
| `onChange` | 值每次变化（键入即校验） | 字段级即时反馈             |
| `onBlur`   | 字段失焦                 | 克制一些的即时校验         |
| `onSubmit` | 表单提交时               | 表单级兜底校验（常用默认） |
| `onMount`  | 字段挂载                 | 回填后的预校验等           |

未声明的键不在该时机校验。提交时 `handleSubmit` 会先跑全部字段级校验、再跑表单级校验，任一失败都不会调用 `onSubmit`。

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

### 跨字段校验（密码确认）

函数式校验器经 `fieldApi.form` 读取整表值：

```ts
validators: {
  onChange: ({ value, fieldApi }) =>
    value === fieldApi.form.state.values.password ? undefined : "两次输入不一致",
}
```

## 组件与 Props

### TForm

表单容器：拦截原生 `submit`（`novalidate`）并调用 `form.handleSubmit()`。

```vue
<TForm :form="form">…</TForm>
```

| Prop    | 类型                                 | 默认值 | 说明               |
| ------- | ------------------------------------ | ------ | ------------------ |
| `form`  | `FormInstance`（`useForm()` 返回值） | —      | 表单实例，**必填** |
| `class` | `string`                             | —      | 追加/覆盖根样式    |

插槽：default——放置 `TFormField` 与 `TFormSubscribe`。

### TFormField

字段作用域：渲染 TanStack `form.Field` 并向下提供字段上下文。

```vue
<TFormField name="email" v-slot="{ field }">…</TFormField>
```

| Prop         | 类型                        | 默认值 | 说明                                                                         |
| ------------ | --------------------------- | ------ | ---------------------------------------------------------------------------- |
| `name`       | `string`                    | —      | 字段名，**必填**；控件 `id` 由它派生                                         |
| `validators` | `Record<string, validator>` | —      | 字段级校验：值为函数或 Standard Schema（如 valibot），按 `onChange` 等键声明 |

作用域插槽 default：`{ field, state }`——`field.state.value` 取值、`field.handleChange` 写值、`field.handleBlur` 失焦、`field.state.meta.errors` 错误列表。

### TFormItem

字段布局容器（无 Props）：为子组件提供 `controlId`、`descriptionId`、`messageId` 上下文；校验错误时根元素带 `data-invalid`。

```vue
<TFormItem>…</TFormItem>
```

### TFormLabel

字段标签：`for` 自动指向字段控件，校验错误时变红。

```vue
<TFormLabel>邮箱</TFormLabel>
```

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `class` | `string` | —      | 追加/覆盖样式 |

### TFormControl

控件包装：把 `id`、`aria-invalid`、`aria-describedby` 合并到唯一子元素（多个子元素时开发期告警）。

```vue
<TFormControl>
  <TInput v-model="…" />
</TFormControl>
```

| Prop    | 类型     | 默认值 | 说明                |
| ------- | -------- | ------ | ------------------- |
| `class` | `string` | —      | 追加/覆盖子元素样式 |

### TFormDescription

辅助说明：挂载即被 `aria-describedby` 关联，卸载自动收缩。

```vue
<TFormDescription>我们不会公开你的邮箱</TFormDescription>
```

| Prop    | 类型     | 默认值 | 说明          |
| ------- | -------- | ------ | ------------- |
| `class` | `string` | —      | 追加/覆盖样式 |

### TFormMessage

错误提示：默认渲染首个校验错误文案（兼容 `string` 与 `{ message }` 对象两种形态）；仅在有错误或传入 `message` 时渲染。

```vue
<TFormMessage />
```

| Prop      | 类型     | 默认值 | 说明                                                           |
| --------- | -------- | ------ | -------------------------------------------------------------- |
| `message` | `string` | —      | 静态覆盖文案：传入后即使无错误也渲染（不走 aria-errormessage） |
| `class`   | `string` | —      | 追加/覆盖样式                                                  |

### TFormSubscribe

提交状态订阅（无 Props），配合 `type="submit"` 按钮使用。

```vue
<TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
  <TButton type="submit" :disabled="!canSubmit">
    {{ isSubmitting ? "提交中…" : "提交" }}
  </TButton>
</TFormSubscribe>
```

作用域插槽 default：`{ canSubmit, isSubmitting }`。

## 场景化示例

### 校验时机对比

用户名失焦触发字段级 `onBlur` 校验，提交时由表单级 `onSubmit` schema 兜底——两处错误都会经 `TFormMessage` 渲染：

<DemoPreview file="form/FormValidationDemo.vue" />

要点：`validators` 键不同互不影响；点击「提交」不满足条件时，先见失焦错误，提交后追加表单级错误。

### 异步提交

`onSubmit` 返回 Promise 期间 `isSubmitting` 为真，`canSubmit` 同时转假禁用按钮，天然防重复提交：

<DemoPreview file="form/FormAsyncSubmitDemo.vue" />

### 编辑回填与重置

异步取数后 `form.setFieldValue()` 逐字段回填；`form.reset()` 恢复到 `defaultValues`：

<DemoPreview file="form/FormBackfillDemo.vue" />

要点：回填后可声明 `onMount` 校验器做预校验；重置按钮直接调 `form.reset()`，无需自行清空。

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
