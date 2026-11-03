<template>
  <div class="flex flex-col items-center gap-3">
    <TSelect v-model="a" :items="frameworks" placeholder="内置下拉箭头" trigger-class="w-64" />
    <TSelect v-model="b" :items="frameworks" placeholder="自定义下拉箭头" trigger-class="w-64">
      <template #trigger-icon>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4 opacity-50"
        >
          <path d="M12 5v14" />
          <path d="m5 12 7 7 7-7" />
        </svg>
      </template>
    </TSelect>
    <p class="text-xs text-muted-foreground">
      使用 Iconify 时可放 <code>&lt;Icon icon="lucide:chevron-down" /&gt;</code> 或
      <code>&lt;span class="icon-[lucide--chevron-down] size-4" /&gt;</code>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const a = ref<string>();
const b = ref<string>();
const frameworks = [
  { label: "Vue", value: "vue" },
  { label: "React", value: "react" },
  { label: "Svelte", value: "svelte" },
];
</script>
