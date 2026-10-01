<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";
import { cn } from "@/lib/utils";

interface Props {
  class?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <ArkMenu.Separator :class="cn('-mx-1 my-1 h-px bg-muted', props.class)" />
</template>
