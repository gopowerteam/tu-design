<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { age: 18 },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form" class="w-full max-w-sm">
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
    <TFormSubscribe v-slot="{ canSubmit }">
      <TButton type="submit" :disabled="!canSubmit">提交</TButton>
    </TFormSubscribe>
  </TForm>
</template>
