<script setup lang="ts">
import { Menu as ArkMenu } from "@ark-ui/vue/menu";

const itemCls =
  "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";
const contentCls =
  "bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md";

function onSelect(details: { value: string }) {
  // eslint-disable-next-line no-console
  console.log("selected:", details.value);
}
</script>

<template>
  <div class="flex justify-center py-24">
    <TDropdownMenu @select="onSelect">
      <TDropdownMenuTrigger as-child>
        <TButton variant="outline">导出</TButton>
      </TDropdownMenuTrigger>
      <TDropdownMenuContent class="w-44">
        <TDropdownMenuItem value="png">导出为 PNG</TDropdownMenuItem>
        <TDropdownMenuItem value="svg">导出为 SVG</TDropdownMenuItem>
        <TDropdownMenuSeparator />
        <!-- 子菜单：库暂未导出包装组件，直接使用 Ark Menu 原语嵌套 -->
        <ArkMenu.Root>
          <ArkMenu.TriggerItem :class="[itemCls, 'justify-between data-[state=open]:bg-accent']">
            更多格式
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </ArkMenu.TriggerItem>
          <ArkMenu.Positioner class="z-50">
            <ArkMenu.Content :class="contentCls">
              <TDropdownMenuItem value="pdf">PDF</TDropdownMenuItem>
              <TDropdownMenuItem value="csv">CSV</TDropdownMenuItem>
              <TDropdownMenuItem value="json">JSON</TDropdownMenuItem>
            </ArkMenu.Content>
          </ArkMenu.Positioner>
        </ArkMenu.Root>
      </TDropdownMenuContent>
    </TDropdownMenu>
  </div>
</template>
