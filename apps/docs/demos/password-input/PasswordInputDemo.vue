<script setup lang="ts">
import { ref } from "vue";

const password = ref("");
const visible = ref(false);
</script>

<template>
  <div class="w-72 space-y-2">
    <TPasswordInput
      v-model="password"
      v-model:visible="visible"
      placeholder="请输入密码"
      auto-complete="new-password"
    />
    <p class="text-sm text-muted-foreground">
      当前{{ visible ? "明文" : "掩码" }}，长度 {{ password.length }}
    </p>
  </div>
</template>
