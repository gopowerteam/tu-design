<script setup lang="ts">
import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonVariants } from "./index";

interface Props {
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  as?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), { as: "button" });
</script>

<template>
  <component
    :is="props.as"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)"
  >
    <slot />
  </component>
</template>
