<script setup lang="ts">
import { computed, useSlots } from "vue";
import { cn } from "@/lib/utils";
import { alertIconPaths, alertIconVariants, alertVariants, type AlertVariants } from "./index";

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

const iconPath = computed(
  () => alertIconPaths[props.variant ?? "default"] ?? alertIconPaths.default,
);

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
