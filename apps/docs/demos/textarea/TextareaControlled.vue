<script setup lang="ts">
import { ref } from "vue";

const bio = ref("");
</script>

<template>
  <div class="w-72 space-y-2">
    <TTextarea v-model="bio" placeholder="个人简介" />
    <p class="text-sm text-muted-foreground">当前值：{{ bio || "（空）" }}</p>
  </div>
</template>
