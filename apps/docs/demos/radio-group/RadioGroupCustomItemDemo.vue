<script setup lang="ts">
import { ref } from "vue";

const size = ref("m");

const sizeItems = [
  { label: "小杯", value: "s" },
  { label: "中杯", value: "m" },
  { label: "大杯", value: "l" },
];

const sizeLabels: Record<string, string> = {
  s: "小杯",
  m: "中杯",
  l: "大杯",
};
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <TRadioGroup v-model:value="size" :items="sizeItems">
      <template #item="{ item, checked }">
        <span
          class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors"
          :class="checked ? 'border-primary bg-primary/5 text-foreground' : 'text-muted-foreground'"
        >
          <span
            class="size-2 rounded-full"
            :class="checked ? 'bg-primary' : 'border border-current bg-transparent'"
          />
          {{ item.label }}
        </span>
      </template>
    </TRadioGroup>
    <p class="text-muted-foreground text-xs">
      #item 接管单项渲染；当前规格：{{ sizeLabels[size] ?? size }}
    </p>
  </div>
</template>
