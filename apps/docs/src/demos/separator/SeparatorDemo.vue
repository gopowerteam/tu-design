<script setup lang="ts">
import { Separator } from "@tu-design/vue";
</script>

<template>
  <div class="flex w-72 flex-col items-center gap-4">
    <span class="text-sm">水平分隔线</span>
    <Separator />
    <div class="flex h-16 items-center gap-4">
      <span class="text-sm">左</span>
      <Separator orientation="vertical" />
      <span class="text-sm">右</span>
    </div>
  </div>
</template>
