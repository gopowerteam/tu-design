<script setup lang="ts">
import { ref } from "vue";

const notify = ref<string>();

const notifyItems = [
  { label: "邮件通知", value: "email" },
  { label: "短信通知", value: "sms" },
];

const singleDisabledItems = [
  { label: "邮件通知", value: "email" },
  { label: "短信通知（禁用）", value: "sms", disabled: true },
];
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-3">
    <div class="flex flex-col items-center gap-3">
      <TRadioGroup default-value="email" disabled :items="notifyItems" />
      <p class="text-muted-foreground text-center text-xs">整组 disabled，全部不可选</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup default-value="email" :items="singleDisabledItems" />
      <p class="text-muted-foreground text-center text-xs">仅单个选项禁用，其余可选</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="notify" invalid :items="notifyItems" />
      <p class="text-muted-foreground text-center text-xs">
        invalid 校验态（{{ notify ? `已选：${notify}` : "未选" }}）
      </p>
    </div>
  </div>
</template>
