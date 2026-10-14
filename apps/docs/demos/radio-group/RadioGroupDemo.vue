<script setup lang="ts">
import { ref } from "vue";

const plan = ref("weekly");
const interval = ref("daily");
const notify = ref<string>();

const intervalOptions = [
  { label: "每天", value: "daily" },
  { label: "每周", value: "weekly", disabled: true },
  { label: "从不", value: "never" },
];
</script>

<template>
  <div class="flex flex-col items-center gap-8">
    <!-- 基础：v-model 垂直列表 -->
    <TRadioGroup v-model:value="plan">
      <TRadioGroupItem value="weekly">每周</TRadioGroupItem>
      <TRadioGroupItem value="monthly">每月</TRadioGroupItem>
      <TRadioGroupItem value="yearly">每年</TRadioGroupItem>
    </TRadioGroup>

    <!-- options 声明式渲染（含禁用项） -->
    <TRadioGroup v-model:value="interval" :options="intervalOptions" />

    <!-- 水平排列 -->
    <TRadioGroup default-value="zh" orientation="horizontal">
      <TRadioGroupItem value="zh">中文</TRadioGroupItem>
      <TRadioGroupItem value="en" disabled>English（禁用）</TRadioGroupItem>
      <TRadioGroupItem value="ja">日本語</TRadioGroupItem>
    </TRadioGroup>

    <!-- invalid 校验态 -->
    <TRadioGroup v-model:value="notify" invalid>
      <TRadioGroupItem value="email">邮件通知</TRadioGroupItem>
      <TRadioGroupItem value="sms">短信通知</TRadioGroupItem>
    </TRadioGroup>

    <p class="text-muted-foreground text-sm">
      订阅计划：{{ plan }} · 通知频率：{{ interval ?? "未选" }} · 通知方式：{{ notify ?? "未选" }}
    </p>
  </div>
</template>
