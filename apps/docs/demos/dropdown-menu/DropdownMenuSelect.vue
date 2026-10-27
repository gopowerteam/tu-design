<template>
  <div class="flex flex-col items-center gap-3 py-24">
    <TDropdownMenu @select="onSelect">
      <TDropdownMenuTrigger as-child>
        <TButton variant="outline">打开菜单</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent>
        <TDropdownMenuItem value="edit">编辑</TDropdownMenuItem>
        <TDropdownMenuItem value="duplicate">复制</TDropdownMenuItem>
        <TDropdownMenuSeparator />
        <TDropdownMenuItem value="delete">删除</TDropdownMenuItem>
      </TDropdownMenuContent>
    </TDropdownMenu>
    <p class="text-xs text-muted-foreground">最后选中：{{ selected || "（尚未选择）" }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const selected = ref("");

function onSelect(details: { value: string }) {
  selected.value = details.value;
}
</script>
