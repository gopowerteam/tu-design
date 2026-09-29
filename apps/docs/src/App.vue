<script setup lang="ts">
import { COMPONENTS } from "./router";
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="w-56 shrink-0 border-r p-4">
      <div class="mb-4 px-2 font-semibold">tu-design</div>
      <nav class="space-y-1">
        <router-link
          v-for="name in COMPONENTS"
          :key="name"
          :to="`/${name}`"
          class="block rounded-md px-2 py-1 text-sm capitalize hover:bg-muted"
          active-class="bg-muted font-medium"
        >
          {{ name }}
        </router-link>
      </nav>
    </aside>
    <main class="min-w-0 flex-1">
      <router-view />
    </main>
  </div>
</template>
