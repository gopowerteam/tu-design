<template>
  <div class="flex flex-col items-center gap-3">
    <TButton @click="open = true">提交审批</TButton>
    <p class="text-xs text-muted-foreground">最近一次操作：{{ lastAction }}</p>
    <TAlertDialog
      v-model:open="open"
      title="提交审批？"
      description="提交后进入审批流程，处理期间不可修改。"
      confirm-text="提交"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const lastAction = ref("暂无");

// 真实异步：确认按钮进入 loading 并锁定 ESC / 遮罩关闭，2 秒后自动关闭
function onConfirm() {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      lastAction.value = "已提交审批";
      resolve();
    }, 2000);
  });
}
</script>
