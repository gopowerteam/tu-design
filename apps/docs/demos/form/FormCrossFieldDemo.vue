<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { password: "", confirmPassword: "" },
  validators: {
    onSubmit: v.object({
      password: v.pipe(v.string(), v.minLength(8, "至少 8 位")),
      confirmPassword: v.pipe(v.string(), v.minLength(1, "请再次输入密码")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log("提交", value);
  },
});

// 跨字段校验：函数式校验器经 fieldApi.form 读取整表值，onChange + onBlur 双键接线
const confirmRules = {
  onChange: ({ value, fieldApi }: { value: string; fieldApi: any }) =>
    value === fieldApi.form.state.values.password ? undefined : "两次输入不一致",
  onBlur: ({ value, fieldApi }: { value: string; fieldApi: any }) =>
    value === fieldApi.form.state.values.password ? undefined : "两次输入不一致",
};
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="password" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>密码</TFormLabel>
        <TFormControl>
          <TInput
            :model-value="field.state.value"
            type="password"
            placeholder="至少 8 位"
            @update:model-value="field.handleChange"
            @focusout="field.handleBlur"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>

    <TFormField name="confirmPassword" v-slot="{ field }" :validators="confirmRules">
      <TFormItem>
        <TFormLabel>确认密码</TFormLabel>
        <TFormControl>
          <TInput
            :model-value="field.state.value"
            type="password"
            placeholder="再输入一次"
            @update:model-value="field.handleChange"
            @focusout="field.handleBlur"
          />
        </TFormControl>
        <TFormDescription>与密码字段实时比对，不一致即报错</TFormDescription>
        <TFormMessage />
      </TFormItem>
    </TFormField>

    <TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
      <TButton type="submit" :disabled="!canSubmit">
        {{ isSubmitting ? "提交中…" : "提交" }}
      </TButton>
    </TFormSubscribe>
  </TForm>
</template>
