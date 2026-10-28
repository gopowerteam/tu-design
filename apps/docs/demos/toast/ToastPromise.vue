<template>
  <div class="flex flex-col items-center gap-3">
    <TButton :disabled="saving" @click="save">保存（跟踪异步状态）</TButton>
    <p class="text-xs text-muted-foreground">
      promise 方法在加载 / 成功 / 失败三个阶段自动切换提示内容
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useToast } from "@/components/toast";

const toast = useToast();
const saving = ref(false);

function save() {
  saving.value = true;
  const task = toast.promise(() => new Promise((resolve) => setTimeout(resolve, 2000)), {
    loading: { title: "正在保存…" },
    success: { title: "保存成功" },
    error: { title: "保存失败" },
  });
  task?.unwrap().finally(() => {
    saving.value = false;
  });
}
</script>
