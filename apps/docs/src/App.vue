<script setup lang="ts">
import { cn } from "@tu-design/vue";

const demoClass = cn("p-2", "p-4", "bg-primary", "text-primary-foreground", "rounded-md");
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background text-foreground">
    <div :class="demoClass">tu-design docs · cn 合并 demo（p-2 + p-4 → p-4）</div>
  </main>
</template>
