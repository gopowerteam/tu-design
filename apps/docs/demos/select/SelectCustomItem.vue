<script setup lang="ts">
import { ref } from "vue";

const lang = ref<string>();
const langs = [
  { label: "TypeScript", value: "ts" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
];
</script>

<template>
  <div class="flex justify-center">
    <TSelect v-model="lang" :items="langs" placeholder="选择语言" trigger-class="w-64">
      <template #item="{ label, selected }">
        <span class="flex w-full items-center justify-between font-mono text-xs">
          {{ label }}
          <span v-if="selected" class="text-muted-foreground">已选</span>
        </span>
      </template>
    </TSelect>
  </div>
</template>
