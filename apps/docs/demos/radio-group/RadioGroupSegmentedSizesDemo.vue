<script setup lang="ts">
import { ref } from "vue";

const size = ref<string>("default");
const notify = ref<string>();

const sizeItems = [
  { label: "紧凑", value: "sm" },
  { label: "默认", value: "default" },
  { label: "宽松", value: "lg" },
];

const notifyItems = [
  { label: "邮件通知", value: "email" },
  { label: "短信通知", value: "sms", disabled: true },
];
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-3">
    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="size" variant="segmented" size="sm" :items="sizeItems" />
      <p class="text-muted-foreground text-center text-xs">size="sm"</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="size" variant="segmented" :items="sizeItems" />
      <p class="text-muted-foreground text-center text-xs">size="default"（缺省）</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="size" variant="segmented" size="lg" :items="sizeItems" />
      <p class="text-muted-foreground text-center text-xs">size="lg"</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup
        v-model:value="notify"
        variant="segmented"
        default-value="email"
        :items="notifyItems"
      />
      <p class="text-muted-foreground text-center text-xs">单项禁用，其余可选</p>
    </div>

    <div class="flex flex-col items-center gap-3">
      <TRadioGroup v-model:value="notify" variant="segmented" invalid :items="notifyItems" />
      <p class="text-muted-foreground text-center text-xs">
        invalid 校验态（{{ notify ?? "未选" }}）
      </p>
    </div>
  </div>
</template>
