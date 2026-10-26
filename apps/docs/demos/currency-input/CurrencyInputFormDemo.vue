<script setup lang="ts">
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { amount: null as number | null },
  onSubmit: ({ value }) => console.log("提交", value),
});
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="amount" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>合同金额</TFormLabel>
        <TFormControl>
          <TCurrencyInput
            :model-value="field.state.value"
            label-unit="万"
            value-unit="元"
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
