<script setup lang="ts">
import { ref } from "vue";
import type { TreeOption } from "@tu-design/vue";

const regions: TreeOption[] = [
  {
    key: "zj",
    label: "浙江省",
    children: [
      { key: "hz", label: "杭州市" },
      { key: "nb", label: "宁波市" },
    ],
  },
  {
    key: "js",
    label: "江苏省",
    children: [{ key: "nj", label: "南京市" }],
  },
];

const selected = ref<string[]>([]);
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <TTreeSelect v-model="selected" :options="regions" multiple :max-tag-count="1" class="w-64" />
    <p class="text-sm text-muted-foreground">已选：{{ selected.join("、") || "（空）" }}</p>
  </div>
</template>
