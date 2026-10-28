<script setup lang="ts">
const variants = [
  { variant: "default", text: "默认（primary）" },
  { variant: "info", text: "信息（info）" },
  { variant: "success", text: "成功（success）" },
  { variant: "warning", text: "警告（warning）" },
  { variant: "error", text: "错误（destructive）" },
] as const;
</script>

<template>
  <div class="flex w-80 flex-col gap-3">
    <TProgress
      v-for="item in variants"
      :key="item.variant"
      :value="72"
      :variant="item.variant"
      :label="item.text"
    />
  </div>
</template>
