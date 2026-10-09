<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";

const form = useForm({
  defaultValues: { startDate: "" },
  validators: {
    onSubmit: v.object({
      startDate: v.pipe(v.string(), v.isoDate("请选择有效日期")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log("提交", value);
  },
});
</script>

<template>
  <TForm :form="form" class="w-80">
    <TFormField name="startDate" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>开始日期</TFormLabel>
        <TFormControl>
          <TDatePicker
            :model-value="field.state.value"
            placeholder="请选择开始日期"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </TFormControl>
        <TFormDescription>统计区间的起始日</TFormDescription>
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
