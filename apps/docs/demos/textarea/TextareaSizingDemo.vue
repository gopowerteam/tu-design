<script setup lang="ts">
import { ref } from "vue";

const growing = ref("试试继续输入：默认高度随内容自动增长（field-sizing）。");
const fixed = ref("固定高度示例：用 class 覆盖为 h-24，超出内容滚动显示。");
</script>

<template>
  <div class="grid items-start gap-8 sm:grid-cols-2">
    <div class="flex flex-col items-center gap-3">
      <TTextarea v-model="growing" class="w-full" />
      <p class="text-muted-foreground text-center text-xs">
        默认：field-sizing 自适应内容，min-h-16 起步
      </p>
    </div>
    <div class="flex flex-col items-center gap-3">
      <TTextarea v-model="fixed" class="h-24 w-full" />
      <p class="text-muted-foreground text-center text-xs">class="h-24"：固定高度，超出滚动</p>
    </div>
  </div>
</template>
