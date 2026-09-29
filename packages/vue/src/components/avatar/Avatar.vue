<script setup lang="ts">
import { Avatar as ArkAvatar } from "@ark-ui/vue/avatar";
import { cn } from "../../lib/utils";

interface Props {
  src?: string;
  alt?: string;
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkAvatar.Root :class="cn('inline-flex size-10 overflow-hidden rounded-full', props.class)">
    <ArkAvatar.Image
      v-if="props.src"
      :src="props.src"
      :alt="props.alt"
      class="size-full object-cover"
    />
    <ArkAvatar.Fallback class="flex size-full items-center justify-center bg-muted">
      <slot />
    </ArkAvatar.Fallback>
  </ArkAvatar.Root>
</template>
