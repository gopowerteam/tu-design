<script setup lang="ts">
function onSelect(details: { value: string }) {
  // eslint-disable-next-line no-console
  console.log("selected:", details.value);
}
</script>

<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu @select="onSelect">
      <TDropdownMenuTrigger as-child>
        <TButton variant="outline">账号菜单</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent class="w-52">
        <TDropdownMenuGroup label="账号">
          <TDropdownMenuItem value="profile">个人资料</TDropdownMenuItem>
          <TDropdownMenuItem value="billing">账单管理</TDropdownMenuItem>
        </TDropdownMenuGroup>
        <TDropdownMenuSeparator />
        <TDropdownMenuGroup label="帮助">
          <TDropdownMenuItem value="docs">使用文档</TDropdownMenuItem>
          <TDropdownMenuItem value="support" disabled>联系支持（禁用）</TDropdownMenuItem>
        </TDropdownMenuGroup>
        <TDropdownMenuSeparator />
        <TDropdownMenuItem value="logout">退出登录</TDropdownMenuItem>
      </TDropdownMenuContent>
    </TDropdownMenu>
  </div>
</template>
