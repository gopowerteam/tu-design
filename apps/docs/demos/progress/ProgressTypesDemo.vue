<script setup lang="ts">
const types = [
  { type: "default", text: "默认（primary）" },
  { type: "info", text: "信息（info）" },
  { type: "success", text: "成功（success）" },
  { type: "warning", text: "警告（warning）" },
  { type: "error", text: "错误（destructive）" },
] as const;
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <TProgress
      v-for="item in types"
      :key="item.type"
      :value="72"
      :type="item.type"
      :label="item.text"
    />
  </div>
</template>
