<template>
  <div class="flex flex-col items-center gap-3">
    <TButton variant="destructive" @click="open = true">清空回收站</TButton>
    <p class="text-xs text-muted-foreground">最近一次操作：{{ lastAction }}</p>
    <TAlertDialog
      v-model:open="open"
      title="清空回收站？"
      description="回收站中的 12 个文件将被永久删除。"
      destructive
      confirm-text="永久删除"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
const lastAction = ref("暂无");

function onConfirm() {
  lastAction.value = "回收站已清空";
}
</script>
