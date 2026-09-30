<script setup lang="ts">
import { Button } from "@tu-design/vue";
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3">
    <Button>Default</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
    <Button size="sm">Small</Button>
    <Button size="lg">Large</Button>
    <Button size="icon">AI</Button>
    <Button>
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </template>
      Icon 前置
    </Button>
    <Button variant="outline">
      <template #icon>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </template>
      下载
    </Button>
  </div>
</template>
