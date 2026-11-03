<script setup lang="ts">
const items = [
  { value: "all", label: "全部" },
  { value: "unread", label: "未读" },
  { value: "archived", label: "已归档" },
];
</script>

<template>
  <div class="flex justify-center">
    <TTabs default-value="all" :items="items" class="w-96">
      <!-- #trigger 插槽自定义触发按钮内容，缺省渲染 label -->
      <template #trigger="{ item }">
        <span v-if="item.value === 'unread'" class="size-2 rounded-full bg-red-500" />
        {{ item.label }}
      </template>
      <template #panel="{ item }">
        <p class="pt-3 text-sm text-muted-foreground">{{ item.label }}消息列表。</p>
      </template>
    </TTabs>
  </div>
</template>
