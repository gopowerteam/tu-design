<script setup lang="ts">
import { cn } from "@/lib/utils";
import { cardVariants, type CardVariants } from "./index";

interface Props {
  /** 卡片尺寸，联动圆角、字级与分区 padding */
  size?: CardVariants["size"];
  /** 是否显示边框（关闭时同时去掉阴影基底） */
  bordered?: boolean;
  /** 悬浮时提升阴影 */
  hoverable?: boolean;
  /** 可点击卡片：hover 提升 + cursor-pointer */
  interactive?: boolean;
  /** 嵌入式背景（bg-muted/30） */
  embedded?: boolean;
  /** 分区之间显示分隔线（不含 Cover） */
  segmented?: boolean;
  /** 显示关闭按钮，点击触发 close 事件 */
  closable?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: "default",
  bordered: true,
});

const emit = defineEmits<{ close: [] }>();

const segmentedClass = props.segmented
  ? [
      "[&>[data-slot]:not(:first-child):not([data-slot=card-cover])]:border-t",
      "[&>[data-slot=card-content]]:pt-6",
      "[&>[data-slot=card-footer]]:pt-6",
    ]
  : undefined;
</script>

<template>
  <div
    data-slot="card"
    :class="
      cn(
        cardVariants({
          size: props.size,
          bordered: props.bordered,
          hoverable: props.hoverable,
          interactive: props.interactive,
          embedded: props.embedded,
        }),
        segmentedClass,
        props.class,
      )
    "
  >
    <slot />
    <button
      v-if="props.closable"
      type="button"
      aria-label="关闭"
      class="absolute right-3 top-3 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-70 transition-[color,background-color,opacity] hover:bg-muted hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="emit('close')"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4"
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  </div>
</template>
