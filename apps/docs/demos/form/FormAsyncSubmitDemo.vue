<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { email: "" },
  validators: {
    onSubmit: v.object({
      email: v.pipe(v.string(), v.email("邮箱格式不正确")),
    }),
  },
  onSubmit: async ({ value }) => {
    // 模拟网络请求
    await new Promise((resolve) => setTimeout(resolve, 1200));
    console.log("已提交", value.email);
  },
});
</script>

<template>
  <TForm :form="form" class="w-72">
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
