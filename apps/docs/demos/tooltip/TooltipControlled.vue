<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <TButton variant="outline" size="sm" @click="open = !open">
      {{ open ? "关闭提示" : "打开提示" }}
    </TButton>
    <TTooltip v-model:open="open" :positioning="{ placement: 'top' }">
      <TTooltipTrigger as-child>
        <TButton variant="outline">受控触发元素</TButton>
      </TTooltipTrigger>
      <TTooltipContent>开关状态由外部 open ref 驱动（v-model:open）</TTooltipContent>
    </TTooltip>
    <span class="text-xs text-muted-foreground">当前状态：{{ open ? "打开" : "关闭" }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const open = ref(false);
</script>
