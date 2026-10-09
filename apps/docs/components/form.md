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
