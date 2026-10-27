<script setup lang="ts">
import { ref } from "vue";

const bio = ref("");
const maxLength = 120;
</script>

<template>
  <div class="w-full max-w-sm space-y-2">
    <TTextarea v-model="bio" :maxlength="maxLength" placeholder="介绍一下自己…" class="min-h-24" />
    <p class="text-muted-foreground flex justify-between text-xs">
      <span>v-model 双向绑定，maxlength 限制上限</span>
      <span>{{ bio.length }}/{{ maxLength }}</span>
    </p>
  </div>
</template>
