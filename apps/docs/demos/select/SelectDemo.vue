<template>
  <div class="flex justify-center">
    <TSelect v-model="framework" :items="frameworks" placeholder="选择框架" trigger-class="w-64" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const framework = ref<string>();
const frameworks = [
  { label: "Vue", value: "vue" },
  { label: "React", value: "react" },
  { label: "Svelte", value: "svelte" },
];
</script>
