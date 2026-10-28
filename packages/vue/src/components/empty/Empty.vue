<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    class?: string;
    description?: string;
  }>(),
  {
    description: "暂无数据",
  },
);
</script>

<template>
  <div
    role="status"
    :class="
      cn('flex flex-col items-center justify-center gap-3 px-6 py-16 text-center', props.class)
    "
  >
    <div class="text-muted-foreground/60 [&_svg]:size-24">
      <slot name="icon">
        <!-- 内置插画：简洁空盒 -->
        <svg
          viewBox="0 0 96 96"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M48 18 78 34v28L48 78 18 62V34L48 18Z" opacity="0.55" />
          <path d="M18 34l30 16 30-16" opacity="0.55" />
          <path d="M48 50v28" opacity="0.55" />
          <path
            d="M48 18l-8 26 8 6 8-6-8-26Z"
            fill="currentColor"
            fill-opacity="0.12"
            stroke="none"
          />
          <path d="M40 44l8 6 8-6" opacity="0.75" />
        </svg>
      </slot>
    </div>
    <p class="text-sm text-muted-foreground">{{ props.description }}</p>
    <div v-if="$slots.default" class="mt-2 flex items-center gap-3">
      <slot />
    </div>
  </div>
</template>
