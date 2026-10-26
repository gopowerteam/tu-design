<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { password: "" },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="password" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>密码</TFormLabel>
        <TFormControl>
          <TPasswordInput
            :model-value="field.state.value"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
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
