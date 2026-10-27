<script setup lang="ts">
import { ref } from "vue";

const password = ref("");
const visible = ref(false);
</script>

<template>
  <div class="space-y-2">
    <TPasswordInput
      v-model="password"
      v-model:visible="visible"
      placeholder="请输入密码"
      auto-complete="new-password"
      class="w-72"
    />
    <p class="text-xs text-muted-foreground">
      当前{{ visible ? "明文" : "掩码" }}，长度 {{ password.length }}；切换按钮自带 aria-label /
      aria-pressed。
    </p>
  </div>
</template>
