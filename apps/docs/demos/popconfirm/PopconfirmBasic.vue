<template>
  <div class="flex flex-wrap items-center gap-3">
    <TPopconfirm title="确认删除这条记录吗？" @confirm="onConfirm" @cancel="onCancel">
      <TButton variant="outline">删除记录</TButton>
    </TPopconfirm>
    <p class="text-xs text-muted-foreground">最近操作：{{ last ?? "尚无" }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const last = ref<string | null>(null);
function onConfirm() {
  last.value = "已确认删除";
}
function onCancel() {
  last.value = "已取消";
}
</script>
