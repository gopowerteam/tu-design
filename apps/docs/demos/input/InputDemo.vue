<script setup lang="ts">
import { ref } from "vue";

const email = ref("");
</script>

<template>
  <div class="w-full max-w-sm space-y-2">
    <TInput v-model="email" type="email" placeholder="name@example.com" />
    <p class="text-muted-foreground text-xs">当前值：{{ email || "（空）" }}</p>
  </div>
</template>
