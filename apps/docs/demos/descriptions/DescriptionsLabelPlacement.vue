<script setup lang="ts">
import type { DescriptionsColumn, DescriptionsItemData } from "@tu-design/vue";

const items: DescriptionsItemData[] = [
  { label: "用户名", content: "zhangwei" },
  { label: "手机号", content: "138****6688" },
  { label: "邮箱", content: "dev@tu.design" },
  { label: "所属部门", content: "基础架构部" },
];

const column: DescriptionsColumn = { base: 1, sm: 2 };
</script>

<template>
  <div class="flex w-full max-w-2xl flex-col gap-6">
    <TDescriptions
      title="带边框 + 右对齐"
      bordered
      label-placement="left"
      label-align="right"
      :column="column"
      :items="items"
    />
    <TDescriptions
      title="无边框 + 固定标签宽度"
      label-placement="left"
      label-width="5rem"
      separator="："
      :column="1"
      :items="items"
    />
  </div>
</template>
