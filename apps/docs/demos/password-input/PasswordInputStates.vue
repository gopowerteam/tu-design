<script setup lang="ts">
import { ref } from "vue";

const saved = ref("123456");
const wrong = ref("");
</script>

<template>
  <div class="space-y-3">
    <TPasswordInput v-model="saved" disabled class="w-72" />
    <TPasswordInput v-model="wrong" invalid placeholder="两次输入不一致" class="w-72" />
    <p class="text-xs text-muted-foreground">
      disabled 时输入框与切换按钮同时禁用；invalid 套 destructive 边框与焦点环。
    </p>
  </div>
</template>
