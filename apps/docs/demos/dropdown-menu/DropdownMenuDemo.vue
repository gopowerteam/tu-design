<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu>
      <TDropdownMenuTrigger as-child>
        <TButton>打开菜单</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent>
        <TDropdownMenuLabel>操作分组</TDropdownMenuLabel>
        <TDropdownMenuItem value="edit" @select="log('edit')"> 编辑 </TDropdownMenuItem>
        <TDropdownMenuItem value="share" @select="log('share')"> 分享 </TDropdownMenuItem>
        <TDropdownMenuSeparator />
        <TDropdownMenuItem value="delete" disabled> 删除（禁用） </TDropdownMenuItem>
      </TDropdownMenuContent>
    </TDropdownMenu>
  </div>
</template>

<script setup lang="ts">
function log(value: string) {
  // eslint-disable-next-line no-console
  console.log("selected:", value);
}
</script>
