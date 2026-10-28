<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-wrap items-center justify-center gap-3">
      <TButton variant="outline" @click="open = true">程序化打开</TButton>
      <span class="text-xs text-muted-foreground">open = {{ open }}</span>
    </div>
    <TDialog
      v-model:open="open"
      title="受控对话框"
      description="开关状态由 open ref 驱动，Escape / 遮罩关闭会同步回写。"
    >
      <template #trigger>
        <TButton>触发器打开</TButton>
      </template>
      <template #footer="{ close }">
        <TButton @click="close">关闭</TButton>
      </template>
    </TDialog>
    <p class="text-xs text-muted-foreground">
      两种打开方式共用一个状态；无论怎么关，状态都保持同步。
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
