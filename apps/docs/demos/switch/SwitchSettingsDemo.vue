<script setup lang="ts">
import { ref } from "vue";

const settings = ref([
  { key: "email", title: "邮件通知", desc: "订单与物流状态变更时发送邮件", on: true },
  { key: "sms", title: "短信通知", desc: "仅关键节点（发货、签收）发送短信", on: false },
  { key: "push", title: "推送通知", desc: "应用内实时推送，跟随系统免打扰", on: true },
]);
</script>

<template>
  <div class="flex w-80 flex-col gap-1">
    <div
      v-for="(item, index) in settings"
      :key="item.key"
      class="hover:bg-muted/50 flex items-center justify-between gap-4 rounded-lg px-3 py-2.5 transition-colors"
    >
      <span class="flex flex-col gap-0.5">
        <span class="text-sm font-medium">{{ item.title }}</span>
        <span class="text-muted-foreground text-xs">{{ item.desc }}</span>
      </span>
      <TSwitch v-model:checked="item.on" />
    </div>
    <p class="text-muted-foreground mt-2 px-3 text-xs">
      已开启 {{ settings.filter((s) => s.on).length }} / {{ settings.length }} 项
    </p>
  </div>
</template>
