<script setup lang="ts">
import * as v from "valibot";
import { defineForm } from "@tu-design/vue";

interface Feedback {
  contact: string;
  content: string;
}

const feedback = defineForm<Feedback>({
  items: [
    { key: "contact", title: "联系方式", default: "", placeholder: "邮箱或手机号" },
    {
      key: "content",
      title: "反馈内容",
      default: "",
      span: "full",
      render: (r) => r.textarea({ rows: 4, placeholder: "请描述遇到的问题" }),
    },
  ],
  schema: v.object({
    contact: v.pipe(v.string(), v.minLength(1, "请留下联系方式")),
    content: v.pipe(v.string(), v.minLength(5, "至少 5 个字")),
  }),
  onSubmit: async ({ value }) => {
    console.log("反馈提交", value);
  },
});
</script>

<template>
  <div class="w-full">
    <!-- #actions 替换内置按钮组（自动 col-span-full 靠右） -->
    <TFormRender :definition="feedback" :min-width="280">
      <template #actions>
        <TButton variant="ghost" @click="feedback.resetToDefaults()">清空</TButton>
        <TButton @click="feedback.form.handleSubmit()">提交反馈</TButton>
      </template>
    </TFormRender>
    <p class="text-muted-foreground mt-3 text-xs">
      <code>#actions</code> 插槽替换内置按钮组；自定义按钮里调
      <code>form.handleSubmit()</code> 仍是完整校验流（校验失败不执行 onSubmit）。
    </p>
  </div>
</template>
