<template>
  <div class="flex flex-col items-center gap-8 py-4">
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">基础单选</span>
      <TTreeSelect v-model="region" :options="regions" class="w-56" />
    </div>
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">勾选级联（多选）</span>
      <TTreeSelect v-model="checked" :options="regions" checkable cascade class="w-72" />
    </div>
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">可搜索 + 可清空</span>
      <TTreeSelect v-model="searched" :options="regions" filterable clearable class="w-56" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { TreeOption } from "@tu-design/vue";

const regions: TreeOption[] = [
  {
    key: "zj",
    label: "浙江省",
    children: [
      {
        key: "hz",
        label: "杭州市",
        children: [
          { key: "xh", label: "西湖区" },
          { key: "bd", label: "滨江区" },
        ],
      },
      {
        key: "nb",
        label: "宁波市",
        children: [{ key: "ha", label: "海曙区" }],
      },
    ],
  },
  {
    key: "js",
    label: "江苏省",
    children: [
      {
        key: "nj",
        label: "南京市",
        children: [{ key: "xw", label: "玄武区" }],
      },
    ],
  },
];

const region = ref();
const checked = ref<string[]>([]);
const searched = ref();
</script>
