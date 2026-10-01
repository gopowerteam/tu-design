<script setup lang="ts">
import { Select as ArkSelect } from "@ark-ui/vue/select";
import { cn } from "@/lib/utils";

interface Props {
  /** 以默认插槽子元素为渲染目标（chevron 需自行放置） */
  asChild?: boolean;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkSelect.Control class="w-fit">
    <ArkSelect.Trigger
      :as-child="props.asChild"
      :class="
        cn(
          'border-input data-[placeholder]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
          props.class,
        )
      "
    >
      <slot />
      <svg
        v-if="!props.asChild"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4 opacity-50"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </ArkSelect.Trigger>
  </ArkSelect.Control>
</template>
