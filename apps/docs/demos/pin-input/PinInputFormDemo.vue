<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { code: ["", "", "", ""] },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form">
    <TFormField name="code" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>短信验证码</TFormLabel>
        <TFormControl>
          <TPinInput
            :model-value="field.state.value"
            type="numeric"
            :length="4"
            @update:model-value="field.handleChange"
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
