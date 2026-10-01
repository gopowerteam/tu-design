<script setup lang="ts">
import type { PropType } from "vue";
import { computed } from "vue";
import { Select as ArkSelect } from "@ark-ui/vue/select";
import { cn } from "@/lib/utils";
import { normalizeSelectItem, type SelectItemOption } from "./types";

interface Props {
  /** 选项（与 TSelect 的 items 中对应项一致，或直接传字符串） */
  item: string | SelectItemOption;
  class?: string;
}

const props = defineProps({
  item: {
    type: [String, Object] as PropType<string | SelectItemOption>,
    required: true,
  },
  class: { type: String, default: undefined },
});

const normalized = computed(() => normalizeSelectItem(props.item));
</script>

<template>
  <ArkSelect.Item
    :item="normalized"
    :class="
      cn(
        'data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
  >
    <ArkSelect.ItemText>{{ normalized.label }}</ArkSelect.ItemText>
    <ArkSelect.ItemIndicator class="absolute right-2">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </ArkSelect.ItemIndicator>
  </ArkSelect.Item>
</template>
