<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TButton
      variant="outline"
      @click="toast.success({ title: '操作成功', description: '数据已同步' })"
    >
      Success
    </TButton>
    <TButton
      variant="outline"
      @click="toast.error({ title: '操作失败', description: '请稍后重试' })"
    >
      Error
    </TButton>
    <TButton variant="outline" @click="toast.warning({ title: '存储空间不足' })"> Warning </TButton>
    <TButton variant="outline" @click="toast.info({ title: '有新版本可用' })"> Info </TButton>
    <TButton variant="outline" @click="toast.loading({ title: '正在加载…', duration: 5000 })">
      Loading
    </TButton>
  </div>
</template>

<script setup lang="ts">
import { useToast } from "@/components/toast";

const toast = useToast();
</script>
