<script setup lang="ts">
import { ref } from "vue";

const saved = ref("123456");
const wrong = ref("");
</script>

<template>
  <div class="w-72 space-y-3">
    <TPasswordInput v-model="saved" disabled />
    <TPasswordInput v-model="wrong" invalid placeholder="校验失败示例" />
  </div>
</template>
