<template>
  <div class="flex flex-col items-center gap-8 py-4">
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">基础单选（点击叶子选中，回显完整路径）</span>
      <TCascader v-model="addr" :options="regions" class="w-64" />
    </div>
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">勾选级联（多选）</span>
      <TCascader v-model="checked" :options="regions" checkable cascade class="w-72" />
    </div>
    <div class="flex flex-col items-center gap-2">
      <span class="text-muted-foreground text-xs">悬停展开</span>
      <TCascader v-model="hovered" :options="regions" expand-trigger="hover" class="w-64" />
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

const addr = ref();
const checked = ref<string[]>([]);
const hovered = ref();
</script>
