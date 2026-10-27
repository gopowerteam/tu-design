<script setup lang="ts">
import { ref } from "vue";

const notify = ref<string>();
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-3">
    <div class="flex flex-col items-center gap-3">
      <TRadioGroup default-value="email" disabled>
        <TRadioGroupItem value="email">邮件通知</TRadioGroupItem>
        <TRadioGroupItem value="sms">短信通知</TRadioGroupItem>
      </TRadioGroup>
      <p class="text-muted-foreground text-center text-xs">整组 disabled，全部不可选</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup default-value="email">
        <TRadioGroupItem value="email">邮件通知</TRadioGroupItem>
        <TRadioGroupItem value="sms" disabled>短信通知（禁用）</TRadioGroupItem>
      </TRadioGroup>
      <p class="text-muted-foreground text-center text-xs">仅单个选项禁用，其余可选</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="notify" invalid>
        <TRadioGroupItem value="email">邮件通知</TRadioGroupItem>
        <TRadioGroupItem value="sms">短信通知</TRadioGroupItem>
      </TRadioGroup>
      <p class="text-muted-foreground text-center text-xs">
        invalid 校验态（{{ notify ? `已选：${notify}` : "未选" }}）
      </p>
    </div>
  </div>
</template>
