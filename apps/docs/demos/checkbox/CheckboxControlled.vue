<script setup lang="ts">
import { ref } from "vue";

const agreed = ref(false);
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <TCheckbox v-model:checked="agreed">同意服务条款</TCheckbox>
    <p class="text-sm text-muted-foreground">当前状态：{{ agreed ? "已勾选" : "未勾选" }}</p>
  </div>
</template>
