<script setup lang="ts">
import type { MenuItemOption } from "@tu-design/vue";

const items: MenuItemOption[] = [
  {
    type: "group",
    label: "账号",
    children: [
      { type: "item", value: "profile", label: "个人资料" },
      { type: "item", value: "billing", label: "账单管理" },
    ],
  },
  { type: "separator" },
  {
    type: "group",
    label: "帮助",
    children: [
      { type: "item", value: "docs", label: "使用文档" },
      { type: "item", value: "support", label: "联系支持（禁用）", disabled: true },
    ],
  },
  { type: "separator" },
  { type: "item", value: "logout", label: "退出登录" },
];

function onSelect(details: { value: string }) {
  // eslint-disable-next-line no-console
  console.log("selected:", details.value);
}
</script>

<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu :items="items" content-class="w-52" @select="onSelect">
      <TButton variant="outline">账号菜单</TButton>
    </TDropdownMenu>
  </div>
</template>
