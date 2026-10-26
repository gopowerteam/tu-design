<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

const notifyOptions = [
  { label: "邮件通知", value: "email" },
  { label: "短信通知", value: "sms" },
];

const form = useForm({
  defaultValues: { notify: "email" },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form">
    <TFormField name="notify" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>通知方式</TFormLabel>
        <TFormControl>
          <TRadioGroup
            :value="field.state.value"
            name="notify"
            :options="notifyOptions"
            @update:value="field.handleChange"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>
    <TFormSubscribe v-slot="{ canSubmit }">
      <TButton type="submit" :disabled="!canSubmit">提交</TButton>
    </TFormSubscribe>
  </TForm>
</template>
