<template>
  <div class="flex flex-wrap items-center gap-3">
    <TPopconfirm title="提交并发布这篇文章？" @confirm="publish">
      <TButton>发布（异步确认）</TButton>
    </TPopconfirm>
    <TPopconfirm
      title="同步到镜像站点？"
      description="演示 reject：确认失败后气泡保持打开。"
      @confirm="syncMirror"
    >
      <TButton variant="outline">同步（异步失败）</TButton>
    </TPopconfirm>
    <p class="text-xs text-muted-foreground">结果：{{ result }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const result = ref("尚无");
const published = ref(false);

function publish() {
  // 返回 Promise：确认钮 loading、气泡锁定关闭，resolve 后自动关闭
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      published.value = true;
      result.value = "发布成功";
      resolve();
    }, 1200);
  });
}

function syncMirror() {
  // reject：loading 结束，气泡保持打开，可重试
  return new Promise<void>((_, reject) => {
    setTimeout(() => {
      result.value = "同步失败（气泡保持打开）";
      reject(new Error("mirror offline"));
    }, 1200);
  });
}
</script>
