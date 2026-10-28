<script setup lang="ts">
import { computed, useSlots } from "vue";
import { cn } from "@/lib/utils";
import { alertIconVariants, alertVariants, type AlertVariants } from "./index";

interface Props {
  title?: string;
  description?: string;
  variant?: AlertVariants["variant"];
  closable?: boolean;
  showIcon?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  description: undefined,
  variant: "default",
  closable: false,
  showIcon: true,
  class: undefined,
});

const emit = defineEmits<{ close: [] }>();

const slots = useSlots();

const visible = defineModel<boolean>({ default: true });

const role = computed(() => (props.variant === "error" ? "alert" : "status"));

const icons: Record<string, string> = {
  default: "M12 16v-4m0-4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
  info: "M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  success: "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  warning:
    "M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  error: "M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
};

const iconPath = computed(() => icons[props.variant ?? "default"] ?? icons.default);

function onClose() {
  visible.value = false;
  emit("close");
}
</script>

<template>
  <div
    v-if="visible"
    :role="role"
    :class="cn(alertVariants({ variant: props.variant }), props.class)"
  >
    <slot name="icon">
      <svg
        v-if="props.showIcon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        :class="cn(alertIconVariants({ variant: props.variant }))"
      >
        <path :d="iconPath" />
      </svg>
    </slot>

    <div class="min-w-0 flex-1">
      <div v-if="props.title || slots.title" class="font-medium leading-snug">
        <slot name="title">{{ props.title }}</slot>
      </div>
      <div
        v-if="props.description || slots.default"
        :class="
          cn(
            'text-sm leading-relaxed',
            (props.title || slots.title) && 'text-muted-foreground mt-1',
          )
        "
      >
        <slot>{{ props.description }}</slot>
      </div>
    </div>

    <slot name="close">
      <button
        v-if="props.closable"
        type="button"
        aria-label="关闭"
        class="shrink-0 rounded-sm opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring -m-1 p-1"
        @click="onClose"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="size-4"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </slot>
  </div>
</template>
