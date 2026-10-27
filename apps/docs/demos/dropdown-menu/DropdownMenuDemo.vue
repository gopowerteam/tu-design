<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu @select="onSelect">
      <TDropdownMenuTrigger as-child>
        <TButton>打开菜单</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent class="w-48">
        <TDropdownMenuLabel>操作</TDropdownMenuLabel>
        <TDropdownMenuItem value="edit">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          编辑
        </TDropdownMenuItem>
        <TDropdownMenuItem value="share">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
          </svg>
          分享
        </TDropdownMenuItem>
        <TDropdownMenuSeparator />
        <TDropdownMenuItem value="archive" disabled>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="2" y="3" width="20" height="5" rx="1" />
            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
            <path d="M10 12h4" />
          </svg>
          归档（禁用）
        </TDropdownMenuItem>
        <TDropdownMenuSeparator />
        <TDropdownMenuItem
          value="delete"
          class="text-destructive data-[highlighted]:text-destructive"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 6h18" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          删除
        </TDropdownMenuItem>
      </TDropdownMenuContent>
    </TDropdownMenu>
  </div>
</template>

<script setup lang="ts">
function onSelect(details: { value: string }) {
  // eslint-disable-next-line no-console
  console.log("selected:", details.value);
}
</script>
