<script setup lang="ts">
import { cva } from "class-variance-authority";
import { computed, useSlots } from "vue";
import { cn } from "@/lib/utils";

const props = withDefaults(
  defineProps<{
    /** spinner 尺寸 */
    size?: "sm" | "default" | "lg";
    /** 是否处于加载中 */
    spinning?: boolean;
    /** 无障碍标签（role="status" 的 aria-label） */
    label?: string;
    class?: string;
  }>(),
  {
    size: "default",
    spinning: true,
    label: "加载中",
  },
);

const spinVariants = cva("text-primary", {
  variants: {
    size: {
      sm: "size-4",
      default: "size-6",
      lg: "size-8",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// 根元素 aria-busy 始终同步 spinning；包裹态（默认插槽有内容）渲染内容 + 半透明遮罩，独立态仅渲染 spinner
const slots = useSlots();
const hasContent = computed(() => !!slots.default);
</script>

<template>
  <div
    v-if="hasContent || spinning"
    :class="cn(hasContent ? 'relative' : 'inline-flex', props.class)"
    :aria-busy="spinning"
  >
    <slot v-if="hasContent" />

    <div
      v-if="spinning"
      role="status"
      :aria-busy="spinning"
      :aria-label="label"
      :class="
        hasContent
          ? 'absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/60'
          : 'flex'
      "
    >
      <svg
        :class="cn('animate-spin', spinVariants({ size }))"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
        <path
          d="M22 12a10 10 0 0 0-10-10"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        />
      </svg>
    </div>
  </div>
</template>
