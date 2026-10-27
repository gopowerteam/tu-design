<script setup lang="ts">
import { ref } from "vue";

const volume = ref(40);
</script>

<template>
  <div class="flex w-72 flex-col gap-1">
    <div class="text-muted-foreground flex justify-between text-xs">
      <span>音量</span>
      <span>{{ volume }}</span>
    </div>
    <TSlider v-model="volume" />
    <p class="text-muted-foreground text-xs">单值直接传 number，键盘 ←/→ 按 step 微调</p>
  </div>
</template>
