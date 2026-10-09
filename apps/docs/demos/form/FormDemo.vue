<template>
  <TForm :form="form" class="w-80">
    <TFormField name="email" v-slot="{ field }">
      <TFormItem>
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
      </TFormItem>
    </TFormField>

    <TFormField name="password" v-slot="{ field }">
      <TFormItem>
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
      </TFormItem>
    </TFormField>

    <TFormField name="age" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>年龄</TFormLabel>
        <TFormControl>
          <TNumberInput
            :model-value="field.state.value"
            :min="1"
            :max="120"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>

    <TFormField name="amount" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>合同金额（万）</TFormLabel>
        <TFormControl>
          <TCurrencyInput
            :model-value="field.state.value"
            label-unit="万"
            value-unit="元"
            placeholder="0.00"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
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
  defaultValues: { email: "", password: "", age: 18, amount: 15000 },
  validators: {
    onSubmit: v.object({
      email: v.pipe(v.string(), v.email("邮箱格式不正确")),
      password: v.pipe(v.string(), v.minLength(8, "至少 8 位")),
      age: v.pipe(v.number(), v.minValue(1, "至少 1 岁"), v.maxValue(120, "最多 120 岁")),
      amount: v.pipe(v.number(), v.minValue(0, "金额不能为负")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log("登录提交", value);
  },
});
</script>
