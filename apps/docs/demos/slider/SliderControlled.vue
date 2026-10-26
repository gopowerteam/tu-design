<script setup lang="ts">
import { ref } from "vue";

const volume = ref([40]);
const price = ref([20, 80]);
</script>

<template>
  <div class="flex w-72 flex-col items-stretch gap-6">
    <TSlider v-model="volume" :max="100" />
    <TSlider v-model="price" :min="0" :max="200" :step="10" />
    <p class="text-sm text-muted-foreground">
      音量 {{ volume[0] }} · 价格 {{ price[0] }} – {{ price[1] }}
    </p>
  </div>
</template>
