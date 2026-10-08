<template>
  <div class="w-72 space-y-4">
    <TField>
      <TFieldLabel>用户名</TFieldLabel>
      <TFieldInput placeholder="请输入用户名" />
      <TFieldHelperText>不超过 20 个字符</TFieldHelperText>
    </TField>

    <TField :invalid="username.length === 0">
      <TFieldLabel>邮箱</TFieldLabel>
      <TFieldInput v-model="username" placeholder="必填" />
      <TFieldErrorText>邮箱不能为空</TFieldErrorText>
    </TField>

    <TField>
      <TFieldLabel>个人简介</TFieldLabel>
      <TFieldTextarea placeholder="介绍一下自己" />
    </TField>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const username = ref("");
</script>
