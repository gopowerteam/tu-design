<script setup lang="ts">
import * as v from "valibot";
import { ref } from "vue";
import { useForm } from "@tanstack/vue-form";

const agreed = ref(false);

const form = useForm({
  defaultValues: { agreed: false },
  onSubmit: () => console.log("提交"),
});

const agreeRules = {
  onChange: v.pipe(
    v.boolean(),
    v.check((value) => value, "请先阅读并同意服务条款"),
  ),
};
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="agreed" v-slot="{ field }" :validators="agreeRules">
      <TFormItem>
        <TFormControl>
          <TCheckbox
            :checked="field.state.value"
            @update:checked="field.handleChange"
            @focusout="field.handleBlur"
          >
            我已阅读并同意服务条款
          </TCheckbox>
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>
    <TFormSubscribe v-slot="{ canSubmit }">
      <TButton type="submit" :disabled="!canSubmit">提交</TButton>
    </TFormSubscribe>
  </TForm>
</template>
