<script setup lang="ts">
import { ref } from "vue";

const value = ref("");
</script>

<template>
  <div class="w-72 space-y-2">
    <TInput v-model="value" type="email" placeholder="请输入邮箱" />
    <p class="text-sm text-muted-foreground">当前值：{{ value || "（空）" }}</p>
  </div>
</template>
