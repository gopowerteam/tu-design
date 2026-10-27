<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

const notifyOptions = [
  { label: "邮件通知", value: "email" },
  { label: "短信通知", value: "sms" },
];

const notifyRules = {
  onBlur: v.pipe(v.string(), v.minLength(1, "请选择一种通知方式")),
  onChange: v.pipe(v.string(), v.minLength(1, "请选择一种通知方式")),
};

const form = useForm({
  defaultValues: { notify: "" },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="notify" v-slot="{ field }" :validators="notifyRules">
      <TFormItem>
        <TFormLabel>通知方式</TFormLabel>
        <TFormControl>
          <TRadioGroup
            :value="field.state.value"
            name="notify"
            required
            :invalid="field.state.meta.errors.length > 0"
            :options="notifyOptions"
            @update:value="field.handleChange"
            @focusout="field.handleBlur"
          />
        </TFormControl>
        <TFormDescription>required 必填 + 提交时校验</TFormDescription>
        <TFormMessage />
      </TFormItem>
    </TFormField>
    <TFormSubscribe v-slot="{ canSubmit }">
      <TButton type="submit" :disabled="!canSubmit">提交</TButton>
    </TFormSubscribe>
  </TForm>
</template>
