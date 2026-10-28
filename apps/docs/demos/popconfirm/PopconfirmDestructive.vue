<template>
  <div class="flex flex-wrap items-center gap-3">
    <TPopconfirm
      variant="destructive"
      title="永久注销该账号？"
      description="注销后所有数据将被清空，且无法恢复。"
      @confirm="onConfirm"
    >
      <TButton variant="destructive">注销账号</TButton>
    </TPopconfirm>
    <p class="text-xs text-muted-foreground">确认按钮为 destructive 危险色</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const done = ref(false);
function onConfirm() {
  done.value = true;
}
</script>
