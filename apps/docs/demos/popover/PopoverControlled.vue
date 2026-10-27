<template>
  <div class="flex flex-col items-center gap-3">
    <TPopover v-model:open="open">
      <TPopoverTrigger as-child>
        <TButton variant="outline">{{ open ? "受控：已展开" : "受控：已收起" }}</TButton>
      </TPopoverTrigger>
      <TPopoverContent class="w-56">
        <p class="text-sm">开关状态由外部 open ref 驱动，点击外部关闭会同步回写。</p>
      </TPopoverContent>
    </TPopover>
    <TButton variant="ghost" size="sm" @click="open = !open">
      {{ open ? "程序化关闭" : "程序化打开" }}
    </TButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
