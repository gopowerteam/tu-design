<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex flex-wrap items-center justify-center gap-3">
      <TButton variant="outline" @click="open = true">程序化打开</TButton>
      <span class="text-xs text-muted-foreground">open = {{ open }}</span>
    </div>
    <TDrawer v-model:open="open" title="受控抽屉" placement="right">
      <template #trigger>
        <TButton>触发器打开</TButton>
      </template>
      <p class="text-sm text-muted-foreground">
        开关状态由 open ref 驱动，Escape / 遮罩关闭会同步回写。
      </p>
      <template #footer="{ close }">
        <TButton @click="close">关闭</TButton>
      </template>
    </TDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
