<script setup lang="ts">
import * as v from "valibot";
import { useForm } from "@tanstack/vue-form";
import { onMounted } from "vue";

const form = useForm({
  defaultValues: { nickname: "" },
  validators: {
    onSubmit: v.object({
      nickname: v.pipe(v.string(), v.minLength(1, "昵称必填")),
    }),
  },
  onSubmit: async ({ value }) => {
    console.log(value);
  },
});

// 模拟编辑场景：异步取数后回填
async function loadProfile() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  form.setFieldValue("nickname", "云间小满");
}

onMounted(loadProfile);
</script>

<template>
  <TForm :form="form" class="w-72">
    <TFormField name="nickname" v-slot="{ field }">
      <TFormItem>
        <TFormLabel>昵称</TFormLabel>
        <TFormControl>
          <TInput
            :model-value="field.state.value"
            @update:model-value="field.handleChange"
            @blur="field.handleBlur"
          />
        </TFormControl>
        <TFormMessage />
      </TFormItem>
    </TFormField>

    <div class="flex gap-2">
      <TFormSubscribe v-slot="{ canSubmit, isSubmitting }">
        <TButton type="submit" :disabled="!canSubmit">
          {{ isSubmitting ? "保存中…" : "保存" }}
        </TButton>
      </TFormSubscribe>
      <TButton variant="outline" @click="loadProfile">重新拉取</TButton>
      <TButton variant="ghost" @click="form.reset()">重置</TButton>
    </div>
  </TForm>
</template>
