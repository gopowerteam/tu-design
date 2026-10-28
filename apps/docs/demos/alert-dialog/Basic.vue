<template>
  <div class="flex flex-col items-center gap-3">
    <TButton @click="open = true">删除账户</TButton>
    <p class="text-xs text-muted-foreground">最近一次操作：{{ lastAction }}</p>
    <TAlertDialog
      v-model:open="open"
      title="确认删除账户？"
      description="删除后所有数据将被清除，且无法恢复。"
      confirm-text="确认删除"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const lastAction = ref("暂无");

function onConfirm() {
  lastAction.value = "已确认删除";
}
function onCancel() {
  lastAction.value = "已取消";
}
</script>
