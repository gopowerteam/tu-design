<script setup lang="ts">
import * as v from "valibot";
import { defineForm } from "@tu-design/vue";

interface SignUp {
  username: string;
  password: string;
  bio: string;
}

// 字段级校验器：onBlur + onChange 双键接线（只写单个键会漏掉另一时机）
const usernameValidators = {
  onBlur: v.pipe(v.string(), v.minLength(3, "至少 3 个字符")),
  onChange: v.pipe(v.string(), v.maxLength(12, "最多 12 个字符")),
};

const signup = defineForm<SignUp>({
  items: [
    {
      key: "username",
      title: "用户名",
      default: "",
      description: "3–12 个字符：失焦校下限，键入校上限",
      validators: usernameValidators,
      render: (r) => r.input({ placeholder: "cloud" }),
    },
    {
      key: "password",
      title: "密码",
      default: "",
      render: (r) => r.password({ placeholder: "至少 8 位" }),
    },
    {
      key: "bio",
      title: "简介",
      default: "",
      span: "full",
      render: (r) => r.textarea({ rows: 3, placeholder: "一句话介绍自己（选填）" }),
    },
  ],
  schema: v.object({
    username: v.pipe(
      v.string(),
      v.minLength(3, "至少 3 个字符"),
      v.maxLength(12, "最多 12 个字符"),
    ),
    password: v.pipe(v.string(), v.minLength(8, "至少 8 位")),
    bio: v.string(),
  }),
  onSubmit: async ({ value }) => {
    console.log("提交", value);
  },
});
</script>

<template>
  <div class="w-full">
    <TFormRender :definition="signup" submitable :min-width="280" />
    <p class="text-muted-foreground mt-3 text-xs">
      字段级 <code>validators</code>（onBlur + onChange 双键）与表单级 <code>schema</code>
      兜底可叠加；触发「提交」可见 schema 兜底错误。
    </p>
  </div>
</template>
