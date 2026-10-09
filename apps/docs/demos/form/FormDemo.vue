<template>
  <TForm :form="form" class="w-80">
    <TFormField name="email" v-slot="{ field }">
      <TFormLabel>邮箱</TFormLabel>
      <TFormControl>
        <TInput
          :model-value="field.state.value"
          placeholder="you@example.com"
          @update:model-value="field.handleChange"
          @blur="field.handleBlur"
        />
      </TFormControl>
      <TFormDescription>我们不会公开你的邮箱</TFormDescription>
      <TFormMessage />
    </TFormField>

    <TFormField name="password" v-slot="{ field }">
      <TFormLabel>密码</TFormLabel>
      <TFormControl>
        <TInput
          :model-value="field.state.value"
          type="password"
          placeholder="至少 8 位"
          @update:model-value="field.handleChange"
          @blur="field.handleBlur"
        />
      </TFormControl>
      <TFormMessage />
    </TFormField>

    <TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
      <TButton type="submit" :disabled="!canSubmit">
        {{ isSubmitting ? "提交中…" : "登录" }}
      </TButton>
    </TFormSubscribe>
  </TForm>
</template>

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
    console.log("登录提交", value);
  },
});
</script>
