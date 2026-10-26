<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TButton variant="outline" @click="open = true">程序化打开</TButton>
    <span class="text-sm text-muted-foreground">当前状态：{{ open ? "打开" : "关闭" }}</span>
    <TDialog v-model:open="open">
      <TDialogTrigger as-child>
        <TButton>触发器打开</TButton>
      </TDialogTrigger>
      <TDialogContent>
        <TDialogHeader>
          <TDialogTitle>受控对话框</TDialogTitle>
          <TDialogDescription
            >开关状态由 open ref 驱动，Escape / 遮罩关闭会同步回写。</TDialogDescription
          >
        </TDialogHeader>
        <TDialogFooter>
          <TDialogClose as-child>
            <TButton>关闭</TButton>
          </TDialogClose>
        </TDialogFooter>
      </TDialogContent>
    </TDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
