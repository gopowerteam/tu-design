<script setup lang="ts">
import { ref } from "vue";

const value = ref(65);
</script>

<template>
  <div class="flex w-80 flex-col gap-2">
    <TProgress v-model:value="value" label="加载中" />
    <p class="text-muted-foreground text-xs">label 展示标签，v-model:value 受控绑定当前值</p>
  </div>
</template>
