<script setup lang="ts">
import { ref } from "vue";

const visible = ref(true);
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TCard
      v-if="visible"
      closable
      title="可关闭卡片"
      description="点击右上角关闭按钮触发 close 事件。"
      class="w-full max-w-sm"
      @close="visible = false"
    >
      <p class="text-sm text-muted-foreground">组件不控制显隐，由使用者监听 close 后自行处理。</p>
    </TCard>
    <TButton v-else variant="outline" size="sm" @click="visible = true">恢复显示</TButton>
  </div>
</template>
