<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

// 字段级：失焦校验（onBlur）；表单级：提交兜底（onSubmit）
const usernameRules = {
  onBlur: v.pipe(v.string(), v.minLength(3, "失焦校验：至少 3 个字符")),
};

const form = useForm({
  defaultValues: { username: "" },
  validators: {
    onSubmit: v.object({
      username: v.pipe(v.string(), v.minLength(3, "提交校验：至少 3 个字符")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="username" v-slot="{ field }" :validators="usernameRules">
      <TFormItem>
        <TFormLabel>用户名</TFormLabel>
        <TFormControl>
          <TInput
            :model-value="field.state.value"
            placeholder="至少 3 个字符"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </TFormControl>
        <TFormDescription>失焦触发字段级校验，提交触发表单级校验</TFormDescription>
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
