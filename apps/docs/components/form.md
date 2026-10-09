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

| 组件               | 说明                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `TForm`            | 表单容器。props：`form`（`useForm()` 实例）、`class`。拦截原生 submit 并调用 `form.handleSubmit()`（`novalidate`） |
| `TFormField`       | 字段作用域。props：`name`、`validators`（Standard Schema 或函数，字段级校验）。作用域插槽 `{ field, state }`       |
| `TFormItem`        | 字段布局容器，提供 description/message 的静态 id 上下文，错误时带 `data-invalid`                                   |
| `TFormLabel`       | 字段标签，`for` 自动指向字段，错误时变红                                                                           |
| `TFormControl`     | 控件包装：合并 `id`、`aria-invalid`、`aria-describedby` 到唯一子元素（多子元素时开发期告警）                       |
| `TFormDescription` | 辅助说明，`aria-describedby` 指向它；卸载自动收缩                                                                  |
| `TFormMessage`     | 错误提示。props：`message?`（静态覆盖）。默认渲染首个校验错误的文案；仅在有错误或传 `message` 时渲染               |
| `TFormSubscribe`   | 提交状态订阅。作用域插槽 `{ canSubmit, isSubmitting }`                                                             |
