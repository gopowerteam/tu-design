<script setup lang="ts">
import { Dialog as ArkDialog } from "@ark-ui/vue/dialog";
import { cn } from "@/lib/utils";

interface Props {
  /** 是否在内容右上角渲染关闭按钮 */
  showCloseButton?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { showCloseButton: true });
</script>

<template>
  <ArkDialog.Backdrop
    class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
  />
  <ArkDialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <ArkDialog.Content
      :class="
        cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed left-1/2 top-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border p-6 shadow-lg duration-200 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:max-w-lg',
          props.class,
        )
      "
    >
      <slot />
      <ArkDialog.CloseTrigger
        v-if="props.showCloseButton"
        class="absolute right-4 top-4 cursor-pointer rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
        <span class="sr-only">关闭</span>
      </ArkDialog.CloseTrigger>
    </ArkDialog.Content>
  </ArkDialog.Positioner>
</template>
