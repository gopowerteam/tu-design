<script setup lang="ts">
import { Skeleton } from "@tu-design/vue";
</script>

<template>
  <div class="flex w-72 items-center gap-4">
    <Skeleton class="size-12 rounded-full" />
    <div class="flex-1 space-y-2">
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-2/3" />
    </div>
  </div>
</template>
