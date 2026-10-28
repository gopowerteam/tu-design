<template>
  <div class="flex flex-col items-center gap-3">
    <TButton @click="show">显示提示</TButton>
    <p class="text-xs text-muted-foreground">
      ToastProvider 已在本页挂载；点击按钮经 useToast() 弹出提示，3 秒后自动关闭
    </p>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "@/components/toast";

const toast = useToast();

function show() {
  toast.success({ title: "已保存", description: "更改已生效" });
}
</script>
